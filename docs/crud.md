# 🔨 Padrão CRUD

Guia de referência para criar novos módulos CRUD seguindo a arquitetura do projeto.

> **Convenções:** `PascalCase` para classes e interfaces; `camelCase` para arquivos; prefixo `I` para interfaces de repositório.

## 📂 Estrutura de um Módulo

```
modules/<nome>/
├── container/
│   └── index.ts                  # Registra bindings DI do módulo
├── dtos/
│   ├── Create<Nome>DTO.ts        # Dados de entrada para criação
│   ├── Update<Nome>DTO.ts        # Dados de entrada para atualização
│   └── <Nome>ResponseDTO.ts      # Dados de saída (sem campos sensíveis)
├── interfaces/
│   └── I<Nome>.ts                # Interface do modelo de domínio
├── repositories/
│   └── I<Nome>sRepository.ts     # Contrato do repositório
├── services/
│   └── index.ts                  # Todos os services (um por operação)
├── infra/
│   ├── database/
│   │   ├── schemas/
│   │   │   └── <Nome>.ts        # Entidade TypeORM
│   │   └── repositories/
│   │       └── TypeORM<Nome>sRepository.ts
│   └── https/
│       ├── controllers/
│       │   └── <Nome>sController.ts
│       └── routes/
│           └── <nomes>.routes.ts
└── index.ts                      # Barrel exports do módulo
```

---

## 1. Schema TypeORM (`infra/database/schemas/`)

Entidade que mapeia para a tabela no banco.

```typescript
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
```

---

## 2. Interface do Modelo (`interfaces/`)

Interface TypeScript que descreve o modelo de domínio.

```typescript
export interface IProduct {
  id: string;
  name: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. DTOs (`dtos/`)

Interfaces TypeScript puras — sem dependências externas.

```typescript
// CreateProductDTO.ts
export interface CreateProductDTO {
  name: string;
  price: number;
}

// UpdateProductDTO.ts
export interface UpdateProductDTO {
  name?: string;
  price?: number;
}

// ProductResponseDTO.ts
export interface ProductResponseDTO {
  id: string;
  name: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 4. Interface do Repositório (`repositories/`)

Contrato agnóstico ao banco de dados. Services dependem apenas desta interface.

```typescript
import { Product } from "@modules/products/infra/database/schemas/Product";

export interface FindAllQuery {
  skip?: number;
  take?: number;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
}

export interface IProductsRepository {
  create(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product>;
  findAll(query?: FindAllQuery): Promise<Product[]>;
  count(query?: Pick<FindAllQuery, "search">): Promise<number>;
  findById(id: string): Promise<Product | null>;
  update(product: Product): Promise<Product>;
  delete(id: string): Promise<void>;
}
```

---

## 5. Implementação TypeORM (`infra/database/repositories/`)

```typescript
import { injectable } from "tsyringe";
import { Repository } from "typeorm";
import { appDataSource } from "@infra/database/DataSource";
import { FindAllQuery, IProductsRepository } from "@modules/products/repositories/IProductsRepository";
import { Product } from "../schemas/Product";

@injectable()
export class TypeORMProductsRepository implements IProductsRepository {
  private repository: Repository<Product>;

  constructor() {
    this.repository = appDataSource!.getRepository(Product);
  }

  async create(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    const product = this.repository.create(data);
    return this.repository.save(product);
  }

  async findAll(query?: FindAllQuery): Promise<Product[]> {
    const qb = this.repository.createQueryBuilder("product");
    if (query?.search) {
      qb.where("product.name ILIKE :search", { search: `%${query.search}%` });
    }
    if (query?.sortBy) qb.orderBy(`product.${query.sortBy}`, query.sortDesc ? "DESC" : "ASC");
    if (query?.skip) qb.skip(query.skip);
    if (query?.take) qb.take(query.take);
    return qb.getMany();
  }

  async count(query?: Pick<FindAllQuery, "search">): Promise<number> {
    const qb = this.repository.createQueryBuilder("product");
    if (query?.search) {
      qb.where("product.name ILIKE :search", { search: `%${query.search}%` });
    }
    return qb.getCount();
  }

  async findById(id: string): Promise<Product | null> {
    return this.repository.findOneBy({ id });
  }

  async update(product: Product): Promise<Product> {
    return this.repository.save(product);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
```

---

## 6. Services (`services/index.ts`)

**Um service por operação.** Toda regra de negócio fica aqui.

```typescript
import { inject, injectable } from "tsyringe";
import { ConflictError, NotFoundError } from "@core/errors/AppError";
import { CreateProductDTO } from "@modules/products/dtos/CreateProductDTO";
import { UpdateProductDTO } from "@modules/products/dtos/UpdateProductDTO";
import { ProductResponseDTO } from "@modules/products/dtos/ProductResponseDTO";
import { FindAllQuery, IProductsRepository } from "@modules/products/repositories/IProductsRepository";

@injectable()
export class CreateProductService {
  constructor(
    @inject("ProductsRepository")
    private productsRepository: IProductsRepository,
  ) {}

  async execute(data: CreateProductDTO): Promise<ProductResponseDTO> {
    // Regras de negócio aqui (sem Zod — validação na camada HTTP se necessário)
    const product = await this.productsRepository.create(data);
    return product;
  }
}

@injectable()
export class FindAllProductsService {
  constructor(
    @inject("ProductsRepository")
    private productsRepository: IProductsRepository,
  ) {}

  async execute(query?: FindAllQuery): Promise<{ data: ProductResponseDTO[]; total: number }> {
    const [data, total] = await Promise.all([
      this.productsRepository.findAll(query),
      this.productsRepository.count({ search: query?.search }),
    ]);
    return { data, total };
  }
}

@injectable()
export class FindOneProductService {
  constructor(
    @inject("ProductsRepository")
    private productsRepository: IProductsRepository,
  ) {}

  async execute(id: string): Promise<ProductResponseDTO> {
    const product = await this.productsRepository.findById(id);
    if (!product) throw new NotFoundError("Produto não encontrado.");
    return product;
  }
}

@injectable()
export class UpdateProductService {
  constructor(
    @inject("ProductsRepository")
    private productsRepository: IProductsRepository,
  ) {}

  async execute(id: string, data: UpdateProductDTO): Promise<ProductResponseDTO> {
    const product = await this.productsRepository.findById(id);
    if (!product) throw new NotFoundError("Produto não encontrado.");
    if (data.name !== undefined) product.name = data.name;
    if (data.price !== undefined) product.price = data.price;
    return this.productsRepository.update(product);
  }
}

@injectable()
export class DeleteProductService {
  constructor(
    @inject("ProductsRepository")
    private productsRepository: IProductsRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const product = await this.productsRepository.findById(id);
    if (!product) throw new NotFoundError("Produto não encontrado.");
    await this.productsRepository.delete(id);
  }
}
```

---

## 7. Controller (`infra/https/controllers/`)

Responsabilidade única: converter HTTP ↔ Service.

```typescript
import { Request, Response } from "express";
import { container } from "tsyringe";
import {
  CreateProductService,
  DeleteProductService,
  FindAllProductsService,
  FindOneProductService,
  UpdateProductService,
} from "@modules/products/services";

export class ProductsController {
  async findAll(req: Request, res: Response): Promise<Response> {
    const { skip, take, search, sortBy, sortDesc } = req.query;
    const service = container.resolve(FindAllProductsService);
    const result = await service.execute({
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      search: search as string | undefined,
      sortBy: sortBy as string | undefined,
      sortDesc: sortDesc === "true",
    });
    return res.json(result);
  }

  async findOne(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(FindOneProductService);
    return res.json(await service.execute(req.params.id));
  }

  async create(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(CreateProductService);
    return res.status(201).json(await service.execute(req.body));
  }

  async update(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(UpdateProductService);
    return res.json(await service.execute(req.params.id, req.body));
  }

  async delete(req: Request, res: Response): Promise<Response> {
    const service = container.resolve(DeleteProductService);
    await service.execute(req.params.id);
    return res.status(204).send();
  }
}
```

---

## 8. Rotas (`infra/https/routes/`)

```typescript
import { Router } from "express";
import { ProductsController } from "../controllers/ProductsController";

const productsRouter = Router();
const controller = new ProductsController();

productsRouter.get("/", controller.findAll.bind(controller));
productsRouter.get("/:id", controller.findOne.bind(controller));
productsRouter.post("/", controller.create.bind(controller));
productsRouter.patch("/:id", controller.update.bind(controller));
productsRouter.delete("/:id", controller.delete.bind(controller));

export { productsRouter };
```

---

## 9. Container do Módulo (`container/index.ts`)

```typescript
import "reflect-metadata";
import { container } from "tsyringe";
import { IProductsRepository } from "@modules/products/repositories/IProductsRepository";
import { TypeORMProductsRepository } from "@modules/products/infra/database/repositories/TypeORMProductsRepository";

container.registerSingleton<IProductsRepository>("ProductsRepository", TypeORMProductsRepository);
```

---

## 10. Registrar no Servidor

### Em `src/infra/https/routes/routes.ts`

```typescript
import { Router } from "express";
import { productsRouter } from "@modules/products/infra/https/routes/products.routes";

const routes = Router();

routes.use("/products", productsRouter);

export default routes;
```

### Em `src/server.ts`

```typescript
import "@modules/products/container"; // Registra DI do módulo
```

---

## ✅ Checklist: Novo Módulo

- [ ] `infra/database/schemas/<Nome>.ts` — entidade TypeORM
- [ ] `interfaces/I<Nome>.ts` — interface do modelo
- [ ] `dtos/Create<Nome>DTO.ts`, `Update<Nome>DTO.ts`, `<Nome>ResponseDTO.ts`
- [ ] `repositories/I<Nome>sRepository.ts` — contrato
- [ ] `infra/database/repositories/TypeORM<Nome>sRepository.ts` — implementação
- [ ] `services/index.ts` — services (Create, FindAll, FindOne, Update, Delete)
- [ ] `infra/https/controllers/<Nome>sController.ts`
- [ ] `infra/https/routes/<nomes>.routes.ts`
- [ ] `container/index.ts` — binding DI
- [ ] `index.ts` — barrel exports
- [ ] Registrar rota em `infra/https/routes/routes.ts`
- [ ] Importar container em `server.ts`

---

## 💡 Dicas

- **Services:** sempre verificar existência antes de update/delete → `NotFoundError`
- **Conflitos:** verificar unicidade antes de criar → `ConflictError`
- **DTOs:** jamais retornar campos sensíveis (ex: `passwordHash`)
- **Alias:** use `@core/*`, `@infra/*`, `@modules/*` — nunca imports relativos longos
- **Container:** registrar sempre como `registerSingleton` para repositórios
