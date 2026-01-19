import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod, CardType } from './entities/payment-method.entity';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './dto/payment-method.dto';

@Injectable()
export class PaymentMethodsService {
    constructor(
        @InjectRepository(PaymentMethod)
        private readonly paymentMethodRepository: Repository<PaymentMethod>,
    ) { }

    async findAllByUser(userId: string): Promise<PaymentMethod[]> {
        return this.paymentMethodRepository.find({
            where: { userId },
            order: { isPrimary: 'DESC', createdAt: 'DESC' },
        });
    }

    async findById(id: string, userId: string): Promise<PaymentMethod> {
        const paymentMethod = await this.paymentMethodRepository.findOne({
            where: { id, userId },
        });

        if (!paymentMethod) {
            throw new NotFoundException(`Payment method not found: ${id}`);
        }

        return paymentMethod;
    }

    async create(userId: string, dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
        // If this is set as primary, unset other primaries
        if (dto.isPrimary) {
            await this.paymentMethodRepository.update(
                { userId, isPrimary: true },
                { isPrimary: false }
            );
        }

        const paymentMethod = this.paymentMethodRepository.create({
            userId,
            type: dto.type as CardType,
            last4: dto.last4,
            expiry: dto.expiry,
            holderName: dto.holderName,
            isPrimary: dto.isPrimary || false,
            isMobileMoney: dto.isMobileMoney || false,
        });

        return this.paymentMethodRepository.save(paymentMethod);
    }

    async update(id: string, userId: string, dto: UpdatePaymentMethodDto): Promise<PaymentMethod> {
        const paymentMethod = await this.findById(id, userId);

        // If setting as primary, unset other primaries
        if (dto.isPrimary) {
            await this.paymentMethodRepository.update(
                { userId, isPrimary: true },
                { isPrimary: false }
            );
        }

        Object.assign(paymentMethod, dto);
        return this.paymentMethodRepository.save(paymentMethod);
    }

    async delete(id: string, userId: string): Promise<void> {
        const paymentMethod = await this.findById(id, userId);
        const wasPrimary = paymentMethod.isPrimary;

        await this.paymentMethodRepository.remove(paymentMethod);

        // If we deleted the primary, make the first remaining one primary
        if (wasPrimary) {
            const remaining = await this.paymentMethodRepository.findOne({
                where: { userId },
                order: { createdAt: 'ASC' },
            });
            if (remaining) {
                remaining.isPrimary = true;
                await this.paymentMethodRepository.save(remaining);
            }
        }
    }

    async setPrimary(id: string, userId: string): Promise<PaymentMethod> {
        // Unset all primaries for this user
        await this.paymentMethodRepository.update(
            { userId, isPrimary: true },
            { isPrimary: false }
        );

        // Set the new primary
        const paymentMethod = await this.findById(id, userId);
        paymentMethod.isPrimary = true;
        return this.paymentMethodRepository.save(paymentMethod);
    }
}
