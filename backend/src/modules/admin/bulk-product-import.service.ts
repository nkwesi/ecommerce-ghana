import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import AdmZip from 'adm-zip';
import ExcelJS from 'exceljs';
import { DataSource, In, Repository } from 'typeorm';
import { Category, Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Store } from '../inventory/entities/store.entity';
import { StoreInventory } from '../inventory/entities/store-inventory.entity';

const HEADERS = [
  'product_code',
  'product_name',
  'description',
  'category',
  'slug',
  'base_price_ghs',
  'variant_sku',
  'size',
  'colour',
  'colour_hex',
  'variant_price_ghs',
  'compare_at_price_ghs',
  'stock_quantity',
  'store_code',
  'image_file_names',
  'is_featured',
  'is_active',
  'material',
  'care_instructions',
] as const;

type Header = (typeof HEADERS)[number];

interface ImportRow {
  rowNumber: number;
  productCode: string;
  productName: string;
  description: string;
  categoryId: string;
  categoryName: string;
  slug: string;
  basePrice: number;
  variantSku: string;
  size: string;
  colour: string;
  colourHex?: string;
  variantPrice: number;
  compareAtPrice?: number;
  stockQuantity: number;
  storeId: string;
  storeCode: string;
  imageFileNames: string[];
  isFeatured: boolean;
  isActive: boolean;
  material?: string;
  careInstructions?: string;
}

export interface BulkImportPreview {
  fingerprint: string;
  valid: boolean;
  storageReady: boolean;
  rowCount: number;
  productCount: number;
  variantCount: number;
  imageCount: number;
  totalStock: number;
  warnings: string[];
  products: Array<{
    productCode: string;
    name: string;
    category: string;
    slug: string;
    basePrice: number;
    variantCount: number;
    totalStock: number;
    imageFileNames: string[];
  }>;
}

interface ParsedImport {
  preview: BulkImportPreview;
  rows: ImportRow[];
  images: Map<string, { buffer: Buffer; contentType: string }>;
}

@Injectable()
export class BulkProductImportService {
  private readonly supabaseUrl: string;
  private readonly supabaseServiceRoleKey: string;
  private readonly storageBucket: string;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.supabaseUrl = this.configService
      .get<string>('app.supabaseUrl', '')
      .replace(/\/$/, '');
    this.supabaseServiceRoleKey = this.configService.get<string>(
      'app.supabaseServiceRoleKey',
      '',
    );
    this.storageBucket = this.configService.get<string>(
      'app.productImagesBucket',
      'product-images',
    );
  }

  isStorageReady(): boolean {
    return Boolean(
      this.supabaseUrl && this.supabaseServiceRoleKey && this.storageBucket,
    );
  }

  async buildTemplate(): Promise<Buffer> {
    const [categories, stores] = await Promise.all([
      this.categoryRepository.find({
        where: { isActive: true },
        order: { sortOrder: 'ASC' },
      }),
      this.storeRepository.find({
        where: { isActive: true },
        order: { name: 'ASC' },
      }),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Drobe 233';
    workbook.title = 'Drobe 233 bulk product upload template';
    workbook.subject =
      'Validated product, variant, inventory, and image import';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Products', {
      views: [{ state: 'frozen', ySplit: 1, xSplit: 2, showGridLines: false }],
    });
    const instructions = workbook.addWorksheet('Instructions', {
      views: [{ showGridLines: false }],
    });
    const example = workbook.addWorksheet('Example', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
    });
    const lists = workbook.addWorksheet('Lists', { state: 'veryHidden' });

    sheet.columns = [
      { header: 'product_code', key: 'productCode', width: 18 },
      { header: 'product_name', key: 'productName', width: 28 },
      { header: 'description', key: 'description', width: 44 },
      { header: 'category', key: 'category', width: 18 },
      { header: 'slug', key: 'slug', width: 28 },
      { header: 'base_price_ghs', key: 'basePrice', width: 17 },
      { header: 'variant_sku', key: 'variantSku', width: 22 },
      { header: 'size', key: 'size', width: 11 },
      { header: 'colour', key: 'colour', width: 16 },
      { header: 'colour_hex', key: 'colourHex', width: 13 },
      { header: 'variant_price_ghs', key: 'variantPrice', width: 19 },
      { header: 'compare_at_price_ghs', key: 'compareAtPrice', width: 22 },
      { header: 'stock_quantity', key: 'stockQuantity', width: 16 },
      { header: 'store_code', key: 'storeCode', width: 16 },
      { header: 'image_file_names', key: 'images', width: 36 },
      { header: 'is_featured', key: 'isFeatured', width: 14 },
      { header: 'is_active', key: 'isActive', width: 12 },
      { header: 'material', key: 'material', width: 24 },
      { header: 'care_instructions', key: 'careInstructions', width: 34 },
    ];

    const exampleRows = [
      {
        productCode: 'AMA-MIDI',
        productName: 'The Ama Midi Dress',
        description: 'A clean, sculpted midi with an easy drape.',
        category: categories[0]?.slug ?? 'women',
        slug: 'the-ama-midi-dress',
        basePrice: 390,
        variantSku: 'AMA-MIDI-BLK-S',
        size: 'S',
        colour: 'Black',
        colourHex: '#171717',
        variantPrice: 390,
        stockQuantity: 6,
        storeCode: stores[0]?.code ?? 'ACC-MALL',
        images: 'AMA-MIDI-01.jpg|AMA-MIDI-02.jpg',
        isFeatured: 'Yes',
        isActive: 'Yes',
        material: 'Cotton blend',
        careInstructions: 'Cold wash; line dry',
      },
      {
        productCode: 'AMA-MIDI',
        productName: 'The Ama Midi Dress',
        description: 'A clean, sculpted midi with an easy drape.',
        category: categories[0]?.slug ?? 'women',
        slug: 'the-ama-midi-dress',
        basePrice: 390,
        variantSku: 'AMA-MIDI-BLK-M',
        size: 'M',
        colour: 'Black',
        colourHex: '#171717',
        variantPrice: 390,
        stockQuantity: 8,
        storeCode: stores[0]?.code ?? 'ACC-MALL',
        images: 'AMA-MIDI-01.jpg|AMA-MIDI-02.jpg',
        isFeatured: 'Yes',
        isActive: 'Yes',
        material: 'Cotton blend',
        careInstructions: 'Cold wash; line dry',
      },
    ];

    const header = sheet.getRow(1);
    header.height = 32;
    header.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF181713' },
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
    sheet.getColumn('basePrice').numFmt = '₵#,##0.00';
    sheet.getColumn('variantPrice').numFmt = '₵#,##0.00';
    sheet.getColumn('compareAtPrice').numFmt = '₵#,##0.00';
    sheet.getColumn('stockQuantity').numFmt = '0';
    sheet.autoFilter = `A1:${sheet.getColumn(HEADERS.length).letter}1`;

    example.columns = sheet.columns.map((column) => ({
      header: column.header,
      key: column.key,
      width: column.width,
    }));
    example.addRows(exampleRows);
    example.getRow(1).height = 32;
    example.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF181713' },
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
    example.getRows(2, 2)?.forEach((row) => {
      row.height = 38;
      row.alignment = { vertical: 'top', wrapText: true };
    });
    example.getColumn('basePrice').numFmt = '₵#,##0.00';
    example.getColumn('variantPrice').numFmt = '₵#,##0.00';
    example.getColumn('compareAtPrice').numFmt = '₵#,##0.00';
    example.getColumn('stockQuantity').numFmt = '0';
    example.autoFilter = `A1:${example.getColumn(HEADERS.length).letter}3`;

    lists.getCell('A1').value = 'Categories';
    categories.forEach((category, index) => {
      lists.getCell(index + 2, 1).value = category.slug;
    });
    lists.getCell('B1').value = 'Store codes';
    stores.forEach((store, index) => {
      lists.getCell(index + 2, 2).value = store.code;
    });
    lists.getCell('C1').value = 'Yes / No';
    lists.getCell('C2').value = 'Yes';
    lists.getCell('C3').value = 'No';

    for (let row = 2; row <= 501; row += 1) {
      if (categories.length)
        sheet.getCell(`D${row}`).dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [`Lists!$A$2:$A$${categories.length + 1}`],
        };
      if (stores.length)
        sheet.getCell(`N${row}`).dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [`Lists!$B$2:$B$${stores.length + 1}`],
        };
      sheet.getCell(`P${row}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['Lists!$C$2:$C$3'],
      };
      sheet.getCell(`Q${row}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['Lists!$C$2:$C$3'],
      };
      sheet.getCell(`M${row}`).dataValidation = {
        type: 'whole',
        operator: 'greaterThanOrEqual',
        allowBlank: false,
        formulae: [0],
      };
    }

    instructions.columns = [{ width: 24 }, { width: 105 }];
    instructions.mergeCells('A1:B1');
    instructions.getCell('A1').value = 'Drobe 233 bulk product upload';
    instructions.getCell('A1').font = {
      bold: true,
      size: 20,
      color: { argb: 'FFFFFFFF' },
    };
    instructions.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF181713' },
    };
    instructions.getCell('A1').alignment = { vertical: 'middle' };
    instructions.getRow(1).height = 42;
    const guidance = [
      ['Rule', 'What to do'],
      [
        'One row',
        'Enter one sellable size/colour variant for one store. Repeat product details for every variant row.',
      ],
      [
        'Product code',
        'Use a stable code such as AMA-MIDI. It groups rows and must match every image filename prefix.',
      ],
      [
        'Variant SKU',
        'Every size/colour combination needs a unique SKU, for example AMA-MIDI-BLK-S.',
      ],
      [
        'Images',
        'Put JPG, PNG, or WEBP files in one ZIP. Name them PRODUCTCODE-01.jpg, PRODUCTCODE-02.jpg, etc. List multiple names with |.',
      ],
      [
        'Prices',
        'Enter numbers in Ghana cedis without the currency symbol. Variant price may equal the base price.',
      ],
      ['Stock', 'Enter a whole number of units for the selected store code.'],
      [
        'Preview first',
        'The admin page validates categories, stores, duplicate SKUs, image names, file types, prices, and stock before publishing.',
      ],
      [
        'Do not change headers',
        'The importer requires the exact column names in row 1 of the Products sheet.',
      ],
    ];
    instructions.addRow([]);
    instructions.addRows(guidance);
    instructions.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    instructions.getRow(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFC78E55' },
    };
    for (let row = 3; row <= 11; row += 1) {
      instructions.getRow(row).alignment = { vertical: 'top', wrapText: true };
      if (row > 3) instructions.getRow(row).height = 38;
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async preview(
    workbookFile: Express.Multer.File | undefined,
    imagesFile: Express.Multer.File | undefined,
  ): Promise<BulkImportPreview> {
    return (await this.parseAndValidate(workbookFile, imagesFile)).preview;
  }

  async publish(
    workbookFile: Express.Multer.File | undefined,
    imagesFile: Express.Multer.File | undefined,
    expectedFingerprint: string,
  ) {
    if (!this.isStorageReady()) {
      throw new ServiceUnavailableException(
        'Product image storage is not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and PRODUCT_IMAGES_BUCKET.',
      );
    }
    const parsed = await this.parseAndValidate(workbookFile, imagesFile);
    if (
      !expectedFingerprint ||
      expectedFingerprint !== parsed.preview.fingerprint
    ) {
      throw new BadRequestException(
        'The files changed after preview. Preview them again before publishing.',
      );
    }

    const imageUrls = await this.uploadImages(parsed);
    try {
      const result = await this.dataSource.transaction(async (manager) => {
        const products = new Map<string, Product>();
        const variants = new Map<string, ProductVariant>();

        for (const row of parsed.rows) {
          let product = products.get(row.productCode);
          if (!product) {
            product = manager.create(Product, {
              name: row.productName,
              description: row.description,
              slug: row.slug,
              categoryId: row.categoryId,
              basePrice: row.basePrice,
              isActive: row.isActive,
              isFeatured: row.isFeatured,
              images: row.imageFileNames.map((name) => imageUrls.get(name)!),
              metadata: {
                productCode: row.productCode,
                material: row.material || null,
                careInstructions: row.careInstructions || null,
                bulkImportFingerprint: parsed.preview.fingerprint,
              },
            });
            product = await manager.save(Product, product);
            products.set(row.productCode, product);
          }

          let variant = variants.get(row.variantSku);
          if (!variant) {
            variant = manager.create(ProductVariant, {
              productId: product.id,
              sku: row.variantSku,
              sizeCode: row.size,
              sizeModel: 'STANDARD_V1',
              color: row.colour,
              colorHex: row.colourHex,
              price: row.variantPrice,
              compareAtPrice: row.compareAtPrice,
              isActive: row.isActive,
              images: row.imageFileNames.map((name) => imageUrls.get(name)!),
              metadata: { bulkImportFingerprint: parsed.preview.fingerprint },
            });
            variant = await manager.save(ProductVariant, variant);
            variants.set(row.variantSku, variant);
          }

          const inventory = manager.create(StoreInventory, {
            storeId: row.storeId,
            sku: row.variantSku,
            quantity: row.stockQuantity,
            lastSyncedAt: new Date(),
          });
          await manager.save(StoreInventory, inventory);
        }

        return {
          productsCreated: products.size,
          variantsCreated: variants.size,
          inventoryRowsCreated: parsed.rows.length,
        };
      });
      return {
        ...result,
        imagesUploaded: imageUrls.size,
        fingerprint: parsed.preview.fingerprint,
      };
    } catch (error) {
      throw new ConflictException(
        error instanceof Error ? error.message : 'Bulk product publish failed',
      );
    }
  }

  private async parseAndValidate(
    workbookFile: Express.Multer.File | undefined,
    imagesFile: Express.Multer.File | undefined,
  ): Promise<ParsedImport> {
    if (!workbookFile || !imagesFile)
      throw new BadRequestException(
        'Upload both an Excel workbook and an image ZIP file.',
      );
    if (workbookFile.size > 10 * 1024 * 1024)
      throw new BadRequestException('The Excel file must be 10 MB or smaller.');
    if (imagesFile.size > 100 * 1024 * 1024)
      throw new BadRequestException('The image ZIP must be 100 MB or smaller.');
    if (!/\.xlsx$/i.test(workbookFile.originalname))
      throw new BadRequestException(
        'The product file must be an .xlsx workbook.',
      );
    if (!/\.zip$/i.test(imagesFile.originalname))
      throw new BadRequestException(
        'Product images must be uploaded as a .zip file.',
      );

    const [categories, stores] = await Promise.all([
      this.categoryRepository.find({ where: { isActive: true } }),
      this.storeRepository.find({
        where: { isActive: true, isFulfillmentEnabled: true },
      }),
    ]);
    const categoryMap = new Map(
      categories.flatMap((category) => [
        [category.slug.toLowerCase(), category],
        [category.name.toLowerCase(), category],
      ]),
    );
    const storeMap = new Map(
      stores.map((store) => [store.code.toLowerCase(), store]),
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(workbookFile.buffer as unknown as ExcelJS.Buffer);
    const sheet = workbook.getWorksheet('Products') ?? workbook.worksheets[0];
    if (!sheet)
      throw new BadRequestException(
        'The workbook does not contain a Products sheet.',
      );

    const headerMap = new Map<Header, number>();
    sheet.getRow(1).eachCell((cell, column) => {
      const header = String(cell.text).trim().toLowerCase() as Header;
      if ((HEADERS as readonly string[]).includes(header))
        headerMap.set(header, column);
    });
    const missingHeaders = HEADERS.filter((header) => !headerMap.has(header));
    if (missingHeaders.length)
      throw new BadRequestException(
        `Missing required columns: ${missingHeaders.join(', ')}`,
      );

    const zip = new AdmZip(imagesFile.buffer);
    const zipEntries = zip.getEntries().filter((entry) => !entry.isDirectory);
    if (!zipEntries.length)
      throw new BadRequestException('The image ZIP is empty.');
    if (zipEntries.length > 500)
      throw new BadRequestException(
        'The image ZIP cannot contain more than 500 files.',
      );
    const images = new Map<string, { buffer: Buffer; contentType: string }>();
    let uncompressedBytes = 0;
    const errors: string[] = [];

    for (const entry of zipEntries) {
      const fileName = entry.entryName.replace(/\\/g, '/');
      const baseName = fileName.split('/').pop()!;
      if (fileName !== baseName || fileName.includes('..')) {
        errors.push(
          `ZIP entry "${entry.entryName}" must be a file at the ZIP root.`,
        );
        continue;
      }
      if (!/\.(jpe?g|png|webp)$/i.test(baseName)) {
        errors.push(
          `Unsupported image type: ${baseName}. Use JPG, PNG, or WEBP.`,
        );
        continue;
      }
      const key = baseName.toLowerCase();
      if (images.has(key)) {
        errors.push(`Duplicate image filename in ZIP: ${baseName}`);
        continue;
      }
      const buffer = entry.getData();
      uncompressedBytes += buffer.length;
      if (buffer.length > 10 * 1024 * 1024)
        errors.push(`Image ${baseName} is larger than 10 MB.`);
      if (uncompressedBytes > 250 * 1024 * 1024)
        throw new BadRequestException(
          'The uncompressed ZIP content is too large.',
        );
      const contentType = this.detectImageContentType(buffer);
      if (!contentType)
        errors.push(
          `Image ${baseName} content does not match JPG, PNG, or WEBP.`,
        );
      else images.set(key, { buffer, contentType });
    }

    const rows: ImportRow[] = [];
    const warnings: string[] = [];
    const cell = (row: ExcelJS.Row, header: Header) =>
      row.getCell(headerMap.get(header)!).text.trim();
    const numberCell = (row: ExcelJS.Row, header: Header) => {
      const excelCell = row.getCell(headerMap.get(header)!);
      return typeof excelCell.value === 'number'
        ? excelCell.value
        : Number(excelCell.text.replace(/[,₵\s]/g, ''));
    };

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const excelRow = sheet.getRow(rowNumber);
      if (!cell(excelRow, 'product_code') && !cell(excelRow, 'variant_sku'))
        continue;
      const prefix = `Row ${rowNumber}`;
      const productCode = cell(excelRow, 'product_code').toUpperCase();
      const productName = cell(excelRow, 'product_name');
      const categoryValue = cell(excelRow, 'category').toLowerCase();
      const category = categoryMap.get(categoryValue);
      const storeCode = cell(excelRow, 'store_code').toUpperCase();
      const store = storeMap.get(storeCode.toLowerCase());
      const slug = this.slugify(cell(excelRow, 'slug') || productName);
      const variantSku = cell(excelRow, 'variant_sku').toUpperCase();
      const basePrice = numberCell(excelRow, 'base_price_ghs');
      const rawVariantPrice = cell(excelRow, 'variant_price_ghs');
      const variantPrice = rawVariantPrice
        ? numberCell(excelRow, 'variant_price_ghs')
        : basePrice;
      const rawCompareAt = cell(excelRow, 'compare_at_price_ghs');
      const compareAtPrice = rawCompareAt
        ? numberCell(excelRow, 'compare_at_price_ghs')
        : undefined;
      const stockQuantity = numberCell(excelRow, 'stock_quantity');
      const imageFileNames = cell(excelRow, 'image_file_names')
        .split('|')
        .map((name) => name.trim())
        .filter(Boolean);
      const colourHex = cell(excelRow, 'colour_hex') || undefined;

      if (!/^[A-Z0-9][A-Z0-9_-]{2,49}$/.test(productCode))
        errors.push(
          `${prefix}: product_code must be 3-50 letters, numbers, underscores, or hyphens.`,
        );
      if (!productName) errors.push(`${prefix}: product_name is required.`);
      if (!category)
        errors.push(`${prefix}: category "${categoryValue}" does not exist.`);
      if (!slug) errors.push(`${prefix}: slug could not be generated.`);
      if (!Number.isFinite(basePrice) || basePrice <= 0)
        errors.push(`${prefix}: base_price_ghs must be greater than zero.`);
      if (!/^[A-Z0-9][A-Z0-9_-]{2,99}$/.test(variantSku))
        errors.push(
          `${prefix}: variant_sku must be 3-100 letters, numbers, underscores, or hyphens.`,
        );
      if (!cell(excelRow, 'size')) errors.push(`${prefix}: size is required.`);
      if (!cell(excelRow, 'colour'))
        errors.push(`${prefix}: colour is required.`);
      if (colourHex && !/^#[0-9A-F]{6}$/i.test(colourHex))
        errors.push(`${prefix}: colour_hex must look like #171717.`);
      if (!Number.isFinite(variantPrice) || variantPrice <= 0)
        errors.push(`${prefix}: variant_price_ghs must be greater than zero.`);
      if (
        compareAtPrice !== undefined &&
        (!Number.isFinite(compareAtPrice) || compareAtPrice < variantPrice)
      )
        errors.push(
          `${prefix}: compare_at_price_ghs must be at least the variant price.`,
        );
      if (!Number.isInteger(stockQuantity) || stockQuantity < 0)
        errors.push(
          `${prefix}: stock_quantity must be a whole number of zero or more.`,
        );
      if (!store)
        errors.push(
          `${prefix}: store_code "${storeCode}" is not an active fulfilment store.`,
        );
      if (!imageFileNames.length)
        errors.push(`${prefix}: image_file_names is required.`);
      for (const imageName of imageFileNames) {
        if (
          !new RegExp(
            `^${this.escapeRegex(productCode)}-\\d{2}\\.(jpe?g|png|webp)$`,
            'i',
          ).test(imageName)
        ) {
          errors.push(
            `${prefix}: image ${imageName} must follow ${productCode}-01.jpg naming.`,
          );
        } else if (!images.has(imageName.toLowerCase())) {
          errors.push(`${prefix}: image ${imageName} is missing from the ZIP.`);
        }
      }

      rows.push({
        rowNumber,
        productCode,
        productName,
        description: cell(excelRow, 'description'),
        categoryId: category?.id ?? '',
        categoryName: category?.name ?? categoryValue,
        slug,
        basePrice,
        variantSku,
        size: cell(excelRow, 'size'),
        colour: cell(excelRow, 'colour'),
        colourHex,
        variantPrice,
        compareAtPrice,
        stockQuantity,
        storeId: store?.id ?? '',
        storeCode,
        imageFileNames,
        isFeatured: this.parseBoolean(
          cell(excelRow, 'is_featured'),
          false,
          `${prefix}: is_featured`,
          errors,
        ),
        isActive: this.parseBoolean(
          cell(excelRow, 'is_active'),
          true,
          `${prefix}: is_active`,
          errors,
        ),
        material: cell(excelRow, 'material') || undefined,
        careInstructions: cell(excelRow, 'care_instructions') || undefined,
      });
    }

    if (!rows.length) errors.push('The Products sheet has no product rows.');
    if (rows.length > 500)
      errors.push('The workbook cannot contain more than 500 data rows.');

    this.validateConsistency(rows, errors);
    await this.validateDatabaseConflicts(rows, errors);
    const referencedImages = new Set(
      rows.flatMap((row) =>
        row.imageFileNames.map((name) => name.toLowerCase()),
      ),
    );
    for (const imageName of images.keys()) {
      if (!referencedImages.has(imageName))
        warnings.push(
          `Image ${imageName} is in the ZIP but is not referenced by the workbook.`,
        );
    }
    if (!this.isStorageReady())
      warnings.push(
        'Preview is available, but publishing is disabled until Supabase product-image storage is configured.',
      );

    if (errors.length) {
      throw new BadRequestException({
        message: 'Bulk upload validation failed.',
        errors: errors.slice(0, 100),
        warnings,
      });
    }

    const fingerprint = createHash('sha256')
      .update(workbookFile.buffer)
      .update(imagesFile.buffer)
      .digest('hex');
    const productGroups = new Map<string, ImportRow[]>();
    rows.forEach((row) =>
      productGroups.set(row.productCode, [
        ...(productGroups.get(row.productCode) ?? []),
        row,
      ]),
    );
    const preview: BulkImportPreview = {
      fingerprint,
      valid: true,
      storageReady: this.isStorageReady(),
      rowCount: rows.length,
      productCount: productGroups.size,
      variantCount: new Set(rows.map((row) => row.variantSku)).size,
      imageCount: referencedImages.size,
      totalStock: rows.reduce((sum, row) => sum + row.stockQuantity, 0),
      warnings,
      products: [...productGroups.entries()].map(([productCode, group]) => ({
        productCode,
        name: group[0].productName,
        category: group[0].categoryName,
        slug: group[0].slug,
        basePrice: group[0].basePrice,
        variantCount: new Set(group.map((row) => row.variantSku)).size,
        totalStock: group.reduce((sum, row) => sum + row.stockQuantity, 0),
        imageFileNames: group[0].imageFileNames,
      })),
    };
    return { preview, rows, images };
  }

  private validateConsistency(rows: ImportRow[], errors: string[]) {
    const productRows = new Map<string, ImportRow>();
    const variantRows = new Map<string, ImportRow>();
    const inventoryKeys = new Set<string>();
    const slugs = new Map<string, string>();
    for (const row of rows) {
      const firstProduct = productRows.get(row.productCode);
      if (!firstProduct) productRows.set(row.productCode, row);
      else {
        const fields: Array<keyof ImportRow> = [
          'productName',
          'description',
          'categoryId',
          'slug',
          'basePrice',
          'isFeatured',
          'isActive',
          'material',
          'careInstructions',
        ];
        if (
          fields.some((field) => firstProduct[field] !== row[field]) ||
          firstProduct.imageFileNames.join('|') !== row.imageFileNames.join('|')
        ) {
          errors.push(
            `Row ${row.rowNumber}: product details for ${row.productCode} do not match its first row.`,
          );
        }
      }
      const slugOwner = slugs.get(row.slug);
      if (slugOwner && slugOwner !== row.productCode)
        errors.push(
          `Row ${row.rowNumber}: slug ${row.slug} is used by more than one product code.`,
        );
      else slugs.set(row.slug, row.productCode);

      const firstVariant = variantRows.get(row.variantSku);
      if (!firstVariant) variantRows.set(row.variantSku, row);
      else if (
        firstVariant.productCode !== row.productCode ||
        firstVariant.size !== row.size ||
        firstVariant.colour !== row.colour ||
        firstVariant.variantPrice !== row.variantPrice
      ) {
        errors.push(
          `Row ${row.rowNumber}: variant details for SKU ${row.variantSku} do not match its first row.`,
        );
      }
      const inventoryKey = `${row.variantSku}|${row.storeCode}`;
      if (inventoryKeys.has(inventoryKey))
        errors.push(
          `Row ${row.rowNumber}: duplicate SKU/store combination ${row.variantSku} / ${row.storeCode}.`,
        );
      inventoryKeys.add(inventoryKey);
    }
  }

  private async validateDatabaseConflicts(rows: ImportRow[], errors: string[]) {
    const slugs = [...new Set(rows.map((row) => row.slug))];
    const skus = [...new Set(rows.map((row) => row.variantSku))];
    const [products, variants] = await Promise.all([
      this.productRepository.find({
        where: { slug: In(slugs) },
        select: { slug: true },
      }),
      this.variantRepository.find({
        where: { sku: In(skus) },
        select: { sku: true },
      }),
    ]);
    products.forEach((product) =>
      errors.push(
        `Product slug already exists: ${product.slug}. Bulk import only creates new products.`,
      ),
    );
    variants.forEach((variant) =>
      errors.push(`Variant SKU already exists: ${variant.sku}.`),
    );
  }

  private async uploadImages(
    parsed: ParsedImport,
  ): Promise<Map<string, string>> {
    const urls = new Map<string, string>();
    const productByImage = new Map<string, string>();
    parsed.rows.forEach((row) =>
      row.imageFileNames.forEach((name) =>
        productByImage.set(name.toLowerCase(), row.slug),
      ),
    );
    for (const [lowerName, image] of parsed.images) {
      if (!productByImage.has(lowerName)) continue;
      const fileName = parsed.rows
        .flatMap((row) => row.imageFileNames)
        .find((name) => name.toLowerCase() === lowerName)!;
      const objectPath = `products/${productByImage.get(lowerName)}/${fileName}`;
      const encodedPath = objectPath
        .split('/')
        .map(encodeURIComponent)
        .join('/');
      const response = await fetch(
        `${this.supabaseUrl}/storage/v1/object/${encodeURIComponent(this.storageBucket)}/${encodedPath}`,
        {
          method: 'POST',
          headers: {
            apikey: this.supabaseServiceRoleKey,
            Authorization: `Bearer ${this.supabaseServiceRoleKey}`,
            'Content-Type': image.contentType,
            'x-upsert': 'false',
          },
          body: new Uint8Array(image.buffer) as BodyInit,
        },
      );
      if (!response.ok) {
        const detail = await response.text();
        throw new ConflictException(
          `Could not upload ${fileName}: ${detail || response.statusText}`,
        );
      }
      urls.set(
        fileName,
        `${this.supabaseUrl}/storage/v1/object/public/${encodeURIComponent(this.storageBucket)}/${encodedPath}`,
      );
    }
    return urls;
  }

  private parseBoolean(
    value: string,
    fallback: boolean,
    label: string,
    errors: string[],
  ) {
    if (!value) return fallback;
    if (/^(yes|true|1)$/i.test(value)) return true;
    if (/^(no|false|0)$/i.test(value)) return false;
    errors.push(`${label} must be Yes or No.`);
    return fallback;
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 255);
  }

  private detectImageContentType(buffer: Buffer): string | null {
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    )
      return 'image/jpeg';
    if (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    )
      return 'image/png';
    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString() === 'RIFF' &&
      buffer.subarray(8, 12).toString() === 'WEBP'
    )
      return 'image/webp';
    return null;
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
