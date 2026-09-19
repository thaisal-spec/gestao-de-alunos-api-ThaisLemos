import request from 'supertest';
import dotenv from 'dotenv';

dotenv.config();

const baseUrl = process.env.API_URL || 'http://localhost:3000';

/**
 * Helper para realizar o login como Administrador
 * @returns {Promise<string|undefined>} Retorna o token JWT do Admin
 */
export async function loginAdmin() {
  // Tenta primeiro com a rota padrão do projeto (/api/auth/login)
  let response = await request(baseUrl)
    .post('/api/auth/login')
    .send({
      email: 'admin@escola.com',
      senha: 'admin123'
    });
  
  if (response.body && response.body.token) {
    return response.body.token;
  }

  // Fallback caso a rota esteja direto na raiz (/auth/login)
  response = await request(baseUrl)
    .post('/auth/login')
    .send({
      email: 'admin@escola.com',
      senha: 'admin123'
    });

  return response.body ? response.body.token : undefined;
}

/**
 * Helper para realizar o login como Aluno
 * @param {string} email 
 * @param {string} senha 
 * @returns {Promise<string|undefined>} Retorna o token JWT do Aluno
 */
export async function loginAluno(email, senha) {
  // Tenta primeiro com a rota padrão do projeto (/api/auth/login)
  let response = await request(baseUrl)
    .post('/api/auth/login')
    .send({ email, senha });
  
  if (response.body && response.body.token) {
    return response.body.token;
  }

  // Fallback caso a rota esteja direto na raiz (/auth/login)
  response = await request(baseUrl)
    .post('/auth/login')
    .send({ email, senha });

  return response.body ? response.body.token : undefined;
}