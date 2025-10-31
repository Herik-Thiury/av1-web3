import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemPedido } from '../pedido/entities/item-pedido.entity';
import { Produto } from '../produto/entities/produto.entity';
import { Pedido } from '../pedido/entities/pedido.entity';
import { ItemPedidoDto } from '../pedido/dto/item-pedido.dto';

@Injectable()
export class ItemPedidoService {
  constructor(
    @InjectRepository(ItemPedido)
    private itemPedidoRepository: Repository<ItemPedido>,
    @InjectRepository(Produto)
    private produtoRepository: Repository<Produto>,
  ) {}

  async createItem(pedido: Pedido, itemDto: ItemPedidoDto): Promise<ItemPedido> {
    const { produtoId, quantidade } = itemDto;

    const produto = await this.produtoRepository.findOne({
      where: { id: produtoId, statusAtivo: true },
    });

    if (!produto) {
      throw new BadRequestException(`Produto com ID ${produtoId} não encontrado ou inativo.`);
    }

    if (produto.estoque < quantidade) {
      throw new BadRequestException(
        `Estoque insuficiente para o produto ${produto.nome}. Disponível: ${produto.estoque}, Solicitado: ${quantidade}.`,
      );
    }
    
    const precoVenda = produto.preco;
    const subtotal = precoVenda * quantidade;

    return this.itemPedidoRepository.create({
      pedido: pedido,
      produto: produto,
      quantidade: quantidade,
      precoVenda: precoVenda,
      subtotal: subtotal,
    });
  }
}
