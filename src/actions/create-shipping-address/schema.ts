import {cpf as cpfValidator} from "cpf-cnpj-validator";
import { z } from "zod";

// Padrões BR
const BR_PHONE_RGX = /^\(\d{2}\) \d{5}-\d{4}$/; // (11) 99999-9999
const BR_ZIP_RGX = /^\d{5}-\d{3}$/; // 00000-000
const BR_STATE_RGX = /^[A-Za-z]{2}$/; // SP, RJ...

export const createShippingAddressSchema = z.object({
  email: z.email("E-mail inválido"),
  fullName: z.string().trim().min(1, "Nome completo é obrigatório"),
  cpf: z
    .string()
    .min(11, "CPF inválido")
    .refine((value) => cpfValidator.isValid(value), "CPF inválido"),
  phone: z
    .string()
    .regex(BR_PHONE_RGX, "Celular inválido (ex: (11) 99999-9999)"),
  zipCode: z
    .string()
    .regex(BR_ZIP_RGX, "CEP inválido (ex: 01311-000)")
    .transform((v) => v.trim()),
  address: z
    .string().min(1, "Endereço é obrigatório"),
  number: z
    .string()
    .min(1, "Número é obrigatório")
    .transform((v)=>v.trim()),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z
  .string()
  .regex(BR_STATE_RGX, "UF inválida (ex: SP)")
  .transform((v) => v.toUpperCase()),
});

export type CreateShippingAddressSchema = z.infer<
  typeof createShippingAddressSchema
>;
