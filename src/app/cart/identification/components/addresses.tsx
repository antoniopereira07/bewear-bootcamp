"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import cep from "cep-promise";
import { cpf as cpfValidator } from "cpf-cnpj-validator";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import z from "zod";

import { updateShippingAddress } from "@/actions/update-shipping-address";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { shippingAddressTable } from "@/db/schema";
import { useCreateShippingAddress } from "@/hooks/mutations/use-create-shipping-address";
import { useUpdateCartShippingAddress } from "@/hooks/mutations/use-update-cart-shipping-address";
import { useUserAddresses } from "@/hooks/queries/use-user-addresses";

import { formatAddress } from "../../helpers/address";

// -------------------------
// Zod helpers (mesmo schema p/ criar/editar)
// -------------------------
const BR_PHONE_RGX = /^\(\d{2}\)\s?\d{5}-\d{4}$/; // (11) 99999-9999
const BR_ZIP_RGX = /^\d{5}-\d{3}$/; // 00000-000
const BR_STATE_RGX = /^[A-Za-z]{2}$/; // SP, RJ...

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  fullName: z
    .string()
    .min(1, "Nome completo é obrigatório")
    .transform((v) => v.trim()),
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
  address: z.string().min(1, "Endereço é obrigatório"),
  number: z
    .string()
    .min(1, "Número é obrigatório")
    .refine((v) => v.trim().length > 0, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z
    .string()
    .regex(BR_STATE_RGX, "UF inválida (ex: SP)")
    .transform((v) => v.toUpperCase()),
});

type FormValues = z.infer<typeof schema>;

interface AddressesProps {
  shippingAddresses: (typeof shippingAddressTable.$inferSelect)[];
  defaultShippingAddressId: string | null;
}

const Addresses = ({
  shippingAddresses,
  defaultShippingAddressId,
}: AddressesProps) => {
  const router = useRouter();
  const [selectedAddress, setSelectedAddress] = useState<string | null>(
    defaultShippingAddressId || null,
  );

  // Modal/edição
  const [editOpen, setEditOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<
    typeof shippingAddressTable.$inferSelect | null
  >(null);
  const [isFetchingCEPCreate, setIsFetchingCEPCreate] = useState(false);
  const [isFetchingCEPEdit, setIsFetchingCEPEdit] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Query + mutations
  const createShippingAddressMutation = useCreateShippingAddress();
  const updateCartShippingAddressMutation = useUpdateCartShippingAddress();
  const { data: addresses, isLoading } = useUserAddresses({
    initialData: shippingAddresses,
  });

  // Form: criar
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      fullName: "",
      cpf: "",
      phone: "",
      zipCode: "",
      address: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    },
    mode: "onTouched",
  });

  // Form: editar (estado separado)
  const editForm = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      fullName: "",
      cpf: "",
      phone: "",
      zipCode: "",
      address: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    },
    mode: "onTouched",
  });

  // Preenche o form de edição quando selecionar endereço
  useEffect(() => {
    if (!editingAddress) return;
    editForm.reset({
      email: editingAddress.email ?? "",
      fullName: editingAddress.recipientName ?? "",
      cpf: editingAddress.cpfOrCnpj ?? "",
      phone: editingAddress.phone ?? "",
      zipCode: editingAddress.zipCode ?? "",
      address: editingAddress.street ?? "",
      number: editingAddress.number ?? "",
      complement: editingAddress.complement ?? "",
      neighborhood: editingAddress.neighborhood ?? "",
      city: editingAddress.city ?? "",
      state: (editingAddress.state ?? "").toUpperCase(),
    });
  }, [editingAddress, editForm]);

  // CEP Auto-complete: criar
  const handleCEPBlurCreate = async () => {
    const v = form.getValues("zipCode");
    if (!BR_ZIP_RGX.test(v)) return;
    try {
      setIsFetchingCEPCreate(true);
      const result = await cep(v.replace("-", ""));
      form.setValue("address", result.street || "");
      form.setValue("neighborhood", result.neighborhood || "");
      form.setValue("city", result.city || "");
      form.setValue("state", (result.state || "").toUpperCase());
    } catch (err) {
      toast.error(
        "Não foi possível buscar o CEP. Verifique e tente novamente.",
      );
      console.error(err);
    } finally {
      setIsFetchingCEPCreate(false);
    }
  };

  // CEP Auto-complete: editar
  const handleCEPBlurEdit = async () => {
    const v = editForm.getValues("zipCode");
    if (!BR_ZIP_RGX.test(v)) return;
    try {
      setIsFetchingCEPEdit(true);
      const result = await cep(v.replace("-", ""));
      editForm.setValue("address", result.street || "");
      editForm.setValue("neighborhood", result.neighborhood || "");
      editForm.setValue("city", result.city || "");
      editForm.setValue("state", (result.state || "").toUpperCase());
    } catch (err) {
      toast.error(
        "Não foi possível buscar o CEP. Verifique e tente novamente.",
      );
      console.error(err);
    } finally {
      setIsFetchingCEPEdit(false);
    }
  };

  // Criar endereço
  const onSubmitCreate = async (values: FormValues) => {
    try {
      const newAddress =
        await createShippingAddressMutation.mutateAsync(values);
      toast.success("Endereço criado com sucesso!");
      form.reset();
      setSelectedAddress(newAddress.id);

      await updateCartShippingAddressMutation.mutateAsync({
        shippingAddressId: newAddress.id,
      });
      toast.success("Endereço vinculado ao carrinho!");
      router.refresh();
    } catch (error) {
      toast.error("Erro ao criar endereço. Tente novamente.");
      console.error(error);
    }
  };

  // Salvar edição
  const onSubmitEdit = async (values: FormValues) => {
    if (!editingAddress) return;
    try {
      setIsSavingEdit(true);
      await updateShippingAddress({
        id: editingAddress.id,
        ...values,
      });
      toast.success("Endereço atualizado!");
      setEditOpen(false);
      setEditingAddress(null);
      router.refresh();
    } catch (error) {
      toast.error("Erro ao atualizar endereço. Tente novamente.");
      console.error(error);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Ir para pagamento
  const handleGoToPayment = async () => {
    if (!selectedAddress || selectedAddress === "add_new") return;

    try {
      await updateCartShippingAddressMutation.mutateAsync({
        shippingAddressId: selectedAddress,
      });
      toast.success("Endereço selecionado para entrega!");
      router.push("/cart/confirmation");
    } catch (error) {
      toast.error("Erro ao selecionar endereço. Tente novamente.");
      console.error(error);
    }
  };

  // Evitar “piscar” se já existe default
  useEffect(() => {
    if (defaultShippingAddressId) {
      setSelectedAddress(defaultShippingAddressId);
    }
  }, [defaultShippingAddressId]);

  const isSubmittingAny =
    createShippingAddressMutation.isPending ||
    updateCartShippingAddressMutation.isPending;

  return (
    <>
      <Card className="rounded-2xl border-slate-200">
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-4 text-center">
              <p>Carregando endereços...</p>
            </div>
          ) : (
            <RadioGroup
              value={selectedAddress ?? ""}
              onValueChange={setSelectedAddress}
            >
              {addresses?.length === 0 && (
                <div className="py-4 text-center">
                  <p className="text-slate-500">
                    Você ainda não possui endereços cadastrados.
                  </p>
                </div>
              )}

              {addresses?.map((address) => (
                <Card key={address.id} className="mb-3">
                  <CardContent className="flex items-start justify-between gap-3 py-4">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem
                        value={address.id}
                        id={`address-${address.id}`}
                        aria-label={`Selecionar endereço ${address.id}`}
                      />
                      <Label
                        htmlFor={`address-${address.id}`}
                        className="cursor-pointer"
                      >
                        <p className="text-sm whitespace-pre-line">
                          {formatAddress(address)}
                        </p>
                      </Label>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => {
                        setEditingAddress(address);
                        setEditOpen(true);
                      }}
                      aria-label="Editar endereço"
                    >
                      Editar
                    </Button>
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="add_new" id="add_new" />
                    <Label htmlFor="add_new">Adicionar novo endereço</Label>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>
          )}

          {/* Botão ir para pagamento (quando há endereço selecionado existente) */}
          {selectedAddress && selectedAddress !== "add_new" && (
            <div className="mt-4">
              <Button
                onClick={handleGoToPayment}
                className="w-full rounded-full"
                disabled={updateCartShippingAddressMutation.isPending}
              >
                {updateCartShippingAddressMutation.isPending
                  ? "Processando..."
                  : "Ir para pagamento"}
              </Button>
            </div>
          )}

          {/* Form novo endereço */}
          {selectedAddress === "add_new" && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmitCreate)}
                className="mt-4 space-y-4"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Nome */}
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome completo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite seu nome completo"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* CPF */}
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <PatternFormat
                            format="###.###.###-##"
                            placeholder="000.000.000-00"
                            customInput={Input}
                            value={field.value}
                            onValueChange={(vals) => field.onChange(vals.value)}
                            onBlur={field.onBlur}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Celular */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Celular</FormLabel>
                        <FormControl>
                          <PatternFormat
                            format="(##) #####-####"
                            placeholder="(11) 99999-9999"
                            customInput={Input}
                            value={field.value}
                            onValueChange={(vals) =>
                              field.onChange(vals.formattedValue)
                            }
                            onBlur={field.onBlur}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* CEP */}
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <PatternFormat
                            format="#####-###"
                            placeholder="00000-000"
                            customInput={Input}
                            value={field.value}
                            onValueChange={(vals) =>
                              field.onChange(vals.formattedValue)
                            }
                            onBlur={async () => {
                              field.onBlur?.();
                              await handleCEPBlurCreate();
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Endereço */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Rua, avenida..."
                            {...field}
                            disabled={isFetchingCEPCreate}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Número */}
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Complemento */}
                  <FormField
                    control={form.control}
                    name="complement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Apto, bloco, etc. (opcional)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Bairro */}
                  <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Bairro"
                            {...field}
                            disabled={isFetchingCEPCreate}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Cidade */}
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Cidade"
                            {...field}
                            disabled={isFetchingCEPCreate}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Estado */}
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado (UF)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="UF (ex: SP)"
                            maxLength={2}
                            {...field}
                            disabled={isFetchingCEPCreate}
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="submit"
                    className="w-full rounded-full"
                    disabled={isSubmittingAny}
                  >
                    {isSubmittingAny ? "Salvando..." : "Salvar endereço"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Dialog Editar endereço */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingAddress(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar endereço</DialogTitle>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)}>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Email */}
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nome */}
                <FormField
                  control={editForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite seu nome completo"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CPF */}
                <FormField
                  control={editForm.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <PatternFormat
                          format="###.###.###-##"
                          placeholder="000.000.000-00"
                          customInput={Input}
                          value={field.value}
                          onValueChange={(vals) => field.onChange(vals.value)}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Celular */}
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular</FormLabel>
                      <FormControl>
                        <PatternFormat
                          format="(##) #####-####"
                          placeholder="(11) 99999-9999"
                          customInput={Input}
                          value={field.value}
                          onValueChange={(vals) =>
                            field.onChange(vals.formattedValue)
                          }
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CEP */}
                <FormField
                  control={editForm.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <PatternFormat
                          format="#####-###"
                          placeholder="00000-000"
                          customInput={Input}
                          value={field.value}
                          onValueChange={(vals) =>
                            field.onChange(vals.formattedValue)
                          }
                          onBlur={async () => {
                            field.onBlur?.();
                            await handleCEPBlurEdit();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Endereço */}
                <FormField
                  control={editForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Rua, avenida..."
                          {...field}
                          disabled={isFetchingCEPEdit}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Número */}
                <FormField
                  control={editForm.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Complemento */}
                <FormField
                  control={editForm.control}
                  name="complement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Apto, bloco, etc. (opcional)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bairro */}
                <FormField
                  control={editForm.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Bairro"
                          {...field}
                          disabled={isFetchingCEPEdit}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cidade */}
                <FormField
                  control={editForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Cidade"
                          {...field}
                          disabled={isFetchingCEPEdit}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Estado */}
                <FormField
                  control={editForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado (UF)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="UF (ex: SP)"
                          maxLength={2}
                          {...field}
                          disabled={isFetchingCEPEdit}
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="mt-4 gap-2 sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setEditOpen(false);
                    setEditingAddress(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="rounded-full"
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? "Salvando..." : "Salvar alterações"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Addresses;
