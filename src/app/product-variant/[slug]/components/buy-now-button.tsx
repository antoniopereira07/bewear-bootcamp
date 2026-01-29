"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { addProductToCart } from "@/actions/add-cart-product";
import { Button } from "@/components/ui/button";

interface BuyNowButtonProps {
  productVariantId: string;
  quantity: number;
}

export default function BuyNowButton({
  productVariantId,
  quantity,
}: BuyNowButtonProps) {
  const qc = useQueryClient();
  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationKey: ["buyNow", productVariantId, quantity],
    mutationFn: () =>
      addProductToCart({
        productVariantId,
        quantity,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["cart"] });
      router.push("/cart/identification");
    },
  });

  return (
    <Button
      className="rounded-full"
      size="lg"
      disabled={isPending}
      onClick={() => mutate()}
    >
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Comprar agora
    </Button>
  );
}