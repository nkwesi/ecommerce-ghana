import AdmZip from 'adm-zip';
import ExcelJS from 'exceljs';
import { BadRequestException } from '@nestjs/common';
import { BulkProductImportService } from './bulk-product-import.service';

describe('BulkProductImportService', () => {
  const categories = [
    {
      id: 'category-1',
      name: 'Women',
      slug: 'women',
      isActive: true,
      sortOrder: 1,
    },
  ];
  const stores = [
    {
      id: 'store-1',
      name: 'Accra Mall',
      code: 'ACC-MALL',
      isActive: true,
      isFulfillmentEnabled: true,
    },
  ];
  const productRepository = { find: jest.fn(() => Promise.resolve([])) };
  const categoryRepository = {
    find: jest.fn(() => Promise.resolve(categories)),
  };
  const variantRepository = { find: jest.fn(() => Promise.resolve([])) };
  const storeRepository = { find: jest.fn(() => Promise.resolve(stores)) };
  const service = new BulkProductImportService(
    productRepository as never,
    categoryRepository as never,
    variantRepository as never,
    storeRepository as never,
    {} as never,
    { get: (_key: string, fallback: unknown) => fallback } as never,
  );

  function upload(
    name: string,
    buffer: Buffer,
    mimetype: string,
  ): Express.Multer.File {
    return {
      originalname: name,
      buffer,
      size: buffer.length,
      mimetype,
    } as Express.Multer.File;
  }

  function imageZip(includeSecond = true) {
    const zip = new AdmZip();
    zip.addFile('AMA-MIDI-01.jpg', Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00]));
    if (includeSecond)
      zip.addFile(
        'AMA-MIDI-02.jpg',
        Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x01]),
      );
    return zip.toBuffer();
  }

  beforeEach(() => jest.clearAllMocks());

  it('generates a structured workbook and round-trips it through preview validation', async () => {
    const template = await service.buildTemplate();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(template as unknown as ExcelJS.Buffer);

    const products = workbook.getWorksheet('Products');
    expect(products?.getCell('A1').text).toBe('product_code');
    expect(products?.getCell('S1').text).toBe('care_instructions');
    expect(products?.getCell('D2').dataValidation.type).toBe('list');
    expect(workbook.getWorksheet('Instructions')).toBeDefined();
    expect(workbook.getWorksheet('Example')?.rowCount).toBe(3);
    expect(workbook.getWorksheet('Lists')?.state).toBe('veryHidden');

    const example = workbook.getWorksheet('Example')!;
    products!.addRows([
      example.getRow(2).values as ExcelJS.CellValue[],
      example.getRow(3).values as ExcelJS.CellValue[],
    ]);
    const completedWorkbook = Buffer.from(await workbook.xlsx.writeBuffer());

    const preview = await service.preview(
      upload(
        'products.xlsx',
        completedWorkbook,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ),
      upload('images.zip', imageZip(), 'application/zip'),
    );

    expect(preview).toMatchObject({
      valid: true,
      storageReady: false,
      rowCount: 2,
      productCount: 1,
      variantCount: 2,
      imageCount: 2,
      totalStock: 14,
    });
    expect(preview.warnings).toContainEqual(
      expect.stringContaining('publishing is disabled'),
    );
  });

  it('rejects a workbook when a referenced image is missing from the ZIP', async () => {
    const template = await service.buildTemplate();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(template as unknown as ExcelJS.Buffer);
    const products = workbook.getWorksheet('Products')!;
    const example = workbook.getWorksheet('Example')!;
    products.addRows([
      example.getRow(2).values as ExcelJS.CellValue[],
      example.getRow(3).values as ExcelJS.CellValue[],
    ]);
    const completedWorkbook = Buffer.from(await workbook.xlsx.writeBuffer());
    try {
      await service.preview(
        upload(
          'products.xlsx',
          completedWorkbook,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ),
        upload('images.zip', imageZip(false), 'application/zip'),
      );
      throw new Error('Expected preview validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        errors?: string[];
      };
      expect(response.errors).toContainEqual(
        expect.stringContaining('AMA-MIDI-02.jpg is missing'),
      );
    }
  });
});
