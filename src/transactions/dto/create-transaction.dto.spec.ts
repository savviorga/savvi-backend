import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateTransactionDto } from './create-transaction.dto';
import { UpdateTransactionDto } from './update-transaction.dto';

const ACCOUNT = '5b1c9a3e-2f4d-4c6a-9e8b-7a1d2c3b4e5f';
const OTHER = '6b1c9a3e-2f4d-4c6a-9e8b-7a1d2c3b4e5f';

function errors(cls: new () => object, body: object): string[] {
  return validateSync(plainToInstance(cls, body)).map((e) => e.property);
}

describe('CreateTransactionDto', () => {
  const base = { date: '2026-10-20', amount: 1000, account: ACCOUNT };

  it('la categoría es obligatoria salvo en transferencias', () => {
    expect(errors(CreateTransactionDto, { ...base, type: 'egreso' })).toEqual([
      'categoryId',
    ]);
    expect(
      errors(CreateTransactionDto, {
        ...base,
        type: 'transferencia',
        toAccount: OTHER,
      }),
    ).toEqual([]);
  });

  it('la cuenta destino debe ser un UUID', () => {
    expect(
      errors(CreateTransactionDto, {
        ...base,
        type: 'transferencia',
        toAccount: 'nequi',
      }),
    ).toEqual(['toAccount']);
  });
});

describe('UpdateTransactionDto', () => {
  it('permite editar un solo campo', () => {
    expect(errors(UpdateTransactionDto, { amount: 5 })).toEqual([]);
    expect(errors(UpdateTransactionDto, { toAccount: null })).toEqual([]);
  });
});
