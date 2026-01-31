"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { addProductToCart } from "@/actions/add-cart-product";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

interface BuyNowButtonProps {
  productVariantId: string;
  quantity: number;
}

const BuyNowButton = ({ productVariantId, quantity }: BuyNowButtonProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  const { mutate, isPending } = useMutation({
    mutationKey: ["buyNow", productVariantId, quantity],
    mutationFn: () =>
      addProductToCart({
        productVariantId,
        quantity,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      // vai direto para etapa de identificação/endereço
      router.push("/cart/identification");
    },
  });

  const handleClick = () => {
    if (!session?.user?.id) {
      const back = typeof window !== "undefined" ? window.location.pathname : "/";
      router.push(`/authentication?redirect=${encodeURIComponent(back)}`);
      return;
    }
    mutate();
  };

  return (
    <Button
      className="rounded-full"
      size="lg"
      variant="outline"
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Comprar agora
    </Button>
  );
};

export default BuyNowButton;