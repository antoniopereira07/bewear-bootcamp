// src/actions/update-shipping-address/schema.ts
import { cpf } from "cpf-cnpj-validator";
import { z } from "zod";

// helpers
const isValidUF = (v: string) => /^[A-Za-z]{2}$/.test(v || "");
const isValidPhone = (v: string) =>
  // aceita (11) 99999-9999 ou (11) 9999-9999
  /^\(\d{2}\)\s?\d{4,5}-\d{4}$/.test(v || "");
const isValidCEP = (v: string) => /^\d{5}-\d{3}$/.test(v || "");
const isValidCPF = (v: string) => cpf.isValid(v || "");

export const updateShippingAddressSchema = z.object({
  id: z.string().min(1, "ID inválido"),
  email: z.string().email("E-mail inválido"),
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  cpf: z
    .string()
    .min(11, "CPF inválido")
    .refine((v) => isValidCPF(v), "CPF inválido"),
  phone: z
    .string()
    .min(8, "Celular inválido")
    .refine((v) => isValidPhone(v), "Celular inválido (ex: (11) 98888-7777)"),
  zipCode: z
    .string()
    .refine((v) => isValidCEP(v), "CEP inválido (ex: 00000-000)"),
  address: z.string().min(1, "Endereço é obrigatório"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z
    .string()
    .refine((v) => isValidUF(v), "UF inválida (2 letras, ex: SP)"),
});

export type UpdateShippingAddressSchema = z.infer<
  typeof updateShippingAddressSchema
>;