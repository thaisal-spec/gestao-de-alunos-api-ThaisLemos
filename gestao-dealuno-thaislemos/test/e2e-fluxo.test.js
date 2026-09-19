import request from 'supertest';
import { expect } from 'chai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Importa os helpers da pasta ao lado
import { comTokenDeAdmin, getToken } from './helpers/auth.js';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000';

const fixturesPath = path.resolve('test/fixtures/matriculas.json');
const dadosAlunos = JSON.parse(fs.readFileSync(fixturesPath, 'utf-8'));

describe('Fluxo Completo de Testes E2E - Gestão de Alunos', () => {
    let headerAdmin;
    const disciplinaIdPadrao = "disciplina-matematica"; // ID padrão mapeado no seed.js da API

    before(async () => {
        headerAdmin = await comTokenDeAdmin();
        expect(headerAdmin).to.exist;
    });

    dadosAlunos.forEach((cenario, index) => {
        const alunoOriginal = cenario.dadosAluno ? cenario.dadosAluno : cenario;
        const tituloCenario = cenario.testTitle || `Cenário para o aluno: ${alunoOriginal.nome || index}`;

        describe(`${tituloCenario}`, () => {
            let alunoIdSalvo;
            let alunoToken;
            
            // Dados dinâmicos para evitar conflitos de duplicidade 409 no cadastro
            const sufixoUnico = Date.now() + index;
            const alunoDinamico = {
                nome: alunoOriginal.nome,
                email: alunoOriginal.email.replace('@', `${sufixoUnico}@`),
                matricula: `${alunoOriginal.matricula}${index}${String(sufixoUnico).slice(-3)}`,
                senha: alunoOriginal.senha
            };

            it('1. Deve cadastrar um novo aluno com sucesso sendo Admin', async () => {
                const response = await request(API_URL)
                    .post('/api/admin/alunos')
                    .set('Authorization', headerAdmin)
                    .send({
                        nome: alunoDinamico.nome,
                        email: alunoDinamico.email,
                        matricula: alunoDinamico.matricula,
                        senha: alunoDinamico.senha
                    });

                expect(response.status).to.equal(201);
                expect(response.body).to.have.property('id');

                alunoIdSalvo = response.body.id;
            });

            it('2. Deve matricular o aluno na disciplina padrão sendo Admin', async () => {
                expect(alunoIdSalvo, "O ID do aluno não foi guardado").to.not.be.undefined;

                // Rota oficial: /api/admin/disciplinas/:disciplinaId/matriculas
                const response = await request(API_URL)
                    .post(`/api/admin/disciplinas/${disciplinaIdPadrao}/matriculas`)
                    .set('Authorization', headerAdmin)
                    .send({
                        alunoId: alunoIdSalvo
                    });

                // Aceita 201 Created ou 200 OK dependendo do retorno de associação da API
                expect([200, 201]).to.include(response.status);
            });

            it('3. Deve logar como o aluno cadastrado e registrar a entrega do trabalho', async () => {
                expect(alunoIdSalvo, "O ID do aluno não foi guardado").to.not.be.undefined;

                // Loga usando o helper do estudante
                alunoToken = await getToken(alunoDinamico.email, alunoDinamico.senha);
                expect(alunoToken).to.exist;

                // Rota oficial de autoatendimento do aluno: /api/alunos/:alunoId/trabalhos
                const response = await request(API_URL)
                    .post(`/api/alunos/${alunoIdSalvo}/trabalhos`) 
                    .set('Authorization', `Bearer ${alunoToken}`)
                    .send({
                        disciplinaId: disciplinaIdPadrao, 
                        titulo: "Trabalho Final de Automação E2E"
                    });

                expect(response.status).to.equal(201);
                expect(response.body.status).to.equal('entregue');
            });
        });
    });
});