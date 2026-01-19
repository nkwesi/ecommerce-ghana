import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address, AddressType } from './entities/address.entity';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressesService {
    constructor(
        @InjectRepository(Address)
        private readonly addressRepository: Repository<Address>,
    ) { }

    async findAllByUser(userId: string): Promise<Address[]> {
        return this.addressRepository.find({
            where: { userId },
            order: { isDefault: 'DESC', createdAt: 'DESC' },
        });
    }

    async findById(id: string, userId: string): Promise<Address> {
        const address = await this.addressRepository.findOne({
            where: { id, userId },
        });

        if (!address) {
            throw new NotFoundException(`Address not found: ${id}`);
        }

        return address;
    }

    async create(userId: string, dto: CreateAddressDto): Promise<Address> {
        // If this is set as default, unset other defaults
        if (dto.isDefault) {
            await this.addressRepository.update(
                { userId, isDefault: true },
                { isDefault: false }
            );
        }

        const address = this.addressRepository.create({
            userId,
            name: dto.name,
            type: (dto.type || 'home') as AddressType,
            line1: dto.line1,
            line2: dto.line2,
            city: dto.city,
            region: dto.region,
            country: dto.country || 'Ghana',
            phone: dto.phone,
            isDefault: dto.isDefault || false,
        });

        return this.addressRepository.save(address);
    }

    async update(id: string, userId: string, dto: UpdateAddressDto): Promise<Address> {
        const address = await this.findById(id, userId);

        // If setting as default, unset other defaults
        if (dto.isDefault) {
            await this.addressRepository.update(
                { userId, isDefault: true },
                { isDefault: false }
            );
        }

        Object.assign(address, dto);
        return this.addressRepository.save(address);
    }

    async delete(id: string, userId: string): Promise<void> {
        const address = await this.findById(id, userId);
        const wasDefault = address.isDefault;

        await this.addressRepository.remove(address);

        // If we deleted the default, make the first remaining address default
        if (wasDefault) {
            const remaining = await this.addressRepository.findOne({
                where: { userId },
                order: { createdAt: 'ASC' },
            });
            if (remaining) {
                remaining.isDefault = true;
                await this.addressRepository.save(remaining);
            }
        }
    }

    async setDefault(id: string, userId: string): Promise<Address> {
        // Unset all defaults for this user
        await this.addressRepository.update(
            { userId, isDefault: true },
            { isDefault: false }
        );

        // Set the new default
        const address = await this.findById(id, userId);
        address.isDefault = true;
        return this.addressRepository.save(address);
    }
}
