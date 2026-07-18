import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { BulkProductImportService } from './bulk-product-import.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly bulkProductImportService: BulkProductImportService,
  ) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('orders/recent')
  async getRecentOrders(@Query('limit') limit?: string) {
    return this.adminService.getRecentOrders(limit ? parseInt(limit) : 10);
  }

  @Get('orders')
  async getAllOrders(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.getAllOrders({
      status,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Get('users')
  async getAllUsers(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.getAllUsers(
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get('products')
  async getAllProducts(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.getAllProducts({
      search,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Get('products/bulk/template')
  async downloadBulkProductTemplate(@Res() response: Response) {
    const template = await this.bulkProductImportService.buildTemplate();
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="drobe-233-product-upload-template.xlsx"',
    );
    response.setHeader('Content-Length', template.length);
    response.send(template);
  }

  @Post('products/bulk/preview')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'workbook', maxCount: 1 },
        { name: 'images', maxCount: 1 },
      ],
      { limits: { files: 2, fileSize: 100 * 1024 * 1024 } },
    ),
  )
  async previewBulkProducts(
    @UploadedFiles()
    files: {
      workbook?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    return this.bulkProductImportService.preview(
      files.workbook?.[0],
      files.images?.[0],
    );
  }

  @Post('products/bulk/publish')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'workbook', maxCount: 1 },
        { name: 'images', maxCount: 1 },
      ],
      { limits: { files: 2, fileSize: 100 * 1024 * 1024 } },
    ),
  )
  async publishBulkProducts(
    @UploadedFiles()
    files: {
      workbook?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
    @Body('fingerprint') fingerprint: string,
  ) {
    return this.bulkProductImportService.publish(
      files.workbook?.[0],
      files.images?.[0],
      fingerprint,
    );
  }

  @Get('products/:id')
  async getProductById(@Param('id') id: string) {
    return this.adminService.getProductById(id);
  }

  @Post('products')
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return this.adminService.createProduct(createProductDto);
  }

  @Put('products/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.adminService.updateProduct(id, updateProductDto);
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }

  @Get('categories')
  async getCategories() {
    return this.adminService.getCategories();
  }

  @Put('orders/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.adminService.updateOrderStatus(id, status);
  }

  @Put('users/:id/role')
  async updateUserRole(@Param('id') id: string, @Body('role') role: string) {
    return this.adminService.updateUserRole(id, role);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
}
