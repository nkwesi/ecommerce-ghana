# Bulk product upload

The admin product importer creates products, variants, store inventory, and image links in one reviewed batch. It uses the existing database tables, so this feature does not add a database migration.

## One-time production setup

Create a **public** Supabase Storage bucket named `product-images`, then add these variables to the backend Railway service:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_BACKEND_ONLY_SERVICE_ROLE_KEY
PRODUCT_IMAGES_BUCKET=product-images
```

Never put the service-role key in Vercel, any `NEXT_PUBLIC_*` variable, the workbook, or the repository. Restart/redeploy the backend after adding the variables. The admin preview remains available without storage configuration, but Publish is intentionally disabled.

## Upload workflow

1. Sign in at `/admin` and open **Bulk product upload**.
2. Download the current template. Its category and store dropdowns come from the live database.
3. Fill the empty **Products** sheet. Use the separate **Example** and **Instructions** sheets as references; do not rename the headers.
4. Put all referenced JPG, PNG, or WEBP images at the root of one ZIP file.
5. Upload the `.xlsx` and `.zip`, then select **Validate and preview**.
6. Review product, variant, stock, image, and warning totals before selecting **Publish products**.

One row represents one sellable size/colour variant at one fulfilment store. Repeat the same product and variant data when the same SKU is stocked at another store.

## Image names

Every image begins with the exact `product_code`, followed by a hyphen and two-digit sequence:

```text
AMA-MIDI-01.jpg
AMA-MIDI-02.jpg
```

List multiple images in `image_file_names` with a vertical bar:

```text
AMA-MIDI-01.jpg|AMA-MIDI-02.jpg
```

## Safety and limits

- Excel: 10 MB maximum and 500 product rows.
- ZIP: 100 MB compressed, 250 MB uncompressed, and 500 images.
- Individual image: 10 MB maximum.
- Preview verifies exact headers, prices, stock, active categories/stores, SKU/slug conflicts, file names, and real image signatures.
- Publish accepts only the same files that produced the preview fingerprint.
- Bulk upload creates new products only; it never overwrites an existing slug or SKU.
- Published products are read from the backend catalog by the storefront. The launch mock catalog is used only when the catalog API cannot be reached.
