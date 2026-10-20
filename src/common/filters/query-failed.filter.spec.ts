import { QueryFailedError } from 'typeorm';
import { QueryFailedFilter } from './query-failed.filter';

function run(code: string | undefined) {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  };
  const error = new QueryFailedError('SELECT 1', [], {
    code,
    message: 'x',
  } as unknown as Error);
  new QueryFailedFilter().catch(error, host as never);
  return { status, json };
}

describe('QueryFailedFilter', () => {
  it('un UUID mal formado responde 400', () => {
    const { status, json } = run('22P02');
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 }),
    );
  });

  it('duplicados y FK responden 409', () => {
    expect(run('23505').status).toHaveBeenCalledWith(409);
    expect(run('23503').status).toHaveBeenCalledWith(409);
  });

  it('otros errores siguen siendo 500 sin exponer el detalle', () => {
    const { status, json } = run('53300');
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Error interno del servidor' }),
    );
  });
});
