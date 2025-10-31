import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';

@Injectable()
export class ClienteService {
  private readonly logger = new Logger(ClienteService.name);

  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

  /**
   * Cria um novo cliente após validar se o email já existe e criptografar a senha.
   * @param createClienteDto Dados do cliente.
   * @returns O objeto Cliente criado (sem a senha).
   */
  async create(createClienteDto: CreateClienteDto): Promise<Cliente> {
    const { email, senha } = createClienteDto;

    // 1. Regra de Negócio: Verificar se o e-mail já está cadastrado
    const clienteExistente = await this.clienteRepository.findOne({ where: { email } });
    
    if (clienteExistente) {
      this.logger.warn(`Tentativa de cadastro com email duplicado: ${email}`);
      throw new BadRequestException('Este email já está em uso.');
    }

    // 2. Criptografar a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(senha, salt);
    
    // 3. Criar e Salvar no Banco
    const novoCliente = this.clienteRepository.create({
      ...createClienteDto,
      senha: hashedPassword,
    });
    
    // O Exclude() na entidade garante que a senha não retorne para o cliente
    return this.clienteRepository.save(novoCliente);
  }

  
}