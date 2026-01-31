"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { addProductToCart } from "@/actions/add-cart-product";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

interface AddToCartButtonProps {
  productVariantId: string;
  quantity: number;
  onSuccess?: () => void;
}

const AddToCartButton = ({
  productVariantId,
  quantity,
  onSuccess,
}: AddToCartButtonProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const { mutate, isPending } = useMutation({
    mutationKey: ["addProductToCart", productVariantId, quantity],
    mutationFn: () =>
      addProductToCart({
        productVariantId,
        quantity,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      onSuccess?.();
    },
  });

  const handleClick = () => {
    if (!session?.user?.id) {
      const back = typeof window !== "undefined" ? window.location.pathname : "/"
      router.push(`/authentication?redirect=${encodeURIComponent(back)}`);
      return;
    }
    mutate();
  };

  return (
    <Button
      className="rounded-full"
      variant="outline"
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Adicionar à sacola
    </Button>
  );
};

export default AddToCartButton;
