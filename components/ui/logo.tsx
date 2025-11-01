import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  /**
   * Se true, renderiza apenas a imagem do logo
   * @default false
   */
  imageOnly?: boolean;
  /**
   * Se true, adiciona um container decorativo ao redor da imagem
   * @default false
   */
  withContainer?: boolean;
  /**
   * Tamanho do logo
   * @default "default"
   */
  size?: "sm" | "default" | "lg" | "xl";
  /**
   * Se fornecido, o logo será um link para essa URL
   */
  href?: string;
  /**
   * Classes CSS adicionais
   */
  className?: string;
  /**
   * Classe CSS adicional para o texto
   */
  textClassName?: string;
}

const sizeConfig = {
  sm: {
    image: "h-8 w-8",
    container: "h-8 w-8 p-1",
    text: "text-base",
    spacing: "space-x-2",
  },
  default: {
    image: "h-10 w-10 sm:h-12 sm:w-12",
    container: "h-10 w-10 sm:h-12 sm:w-12 p-1.5",
    text: "text-lg sm:text-xl",
    spacing: "space-x-2 sm:space-x-3",
  },
  lg: {
    image: "h-16 w-16 sm:h-20 sm:w-20",
    container: "h-16 w-16 sm:h-20 sm:w-20 p-2",
    text: "text-2xl sm:text-3xl",
    spacing: "space-x-3 sm:space-x-4",
  },
  xl: {
    image: "h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28",
    container: "h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 p-2",
    text: "text-3xl sm:text-4xl lg:text-5xl",
    spacing: "space-x-4 sm:space-x-5",
  },
};

export function Logo({
  imageOnly = false,
  withContainer = false,
  size = "default",
  href,
  className,
  textClassName,
}: LogoProps) {
  const config = sizeConfig[size];
  const imageSizes = {
    sm: "32px",
    default: "(max-width: 640px) 32px, 40px",
    lg: "(max-width: 640px) 64px, 80px",
    xl: "(max-width: 640px) 80px, (max-width: 1024px) 96px, 112px",
  };

  const imageElement = (
    <div
      className={cn(
        "relative flex-shrink-0",
        withContainer
          ? cn(config.container, "rounded-xl bg-transparent shadow-none")
          : config.image
      )}
    >
      {withContainer ? (
        <Image
          src="/vrita-logo.png"
          alt="vRita AI Logo"
          fill
          className="object-contain rounded-md"
          priority={size === "default" || size === "xl"}
          sizes={imageSizes[size]}
        />
      ) : (
        <Image
          src="/vrita-logo.png"
          alt="vRita AI Logo"
          width={
            size === "sm"
              ? 32
              : size === "default"
              ? 48
              : size === "lg"
              ? 80
              : 112
          }
          height={
            size === "sm"
              ? 32
              : size === "default"
              ? 48
              : size === "lg"
              ? 80
              : 112
          }
          className="object-contain"
          priority={size === "default" || size === "xl"}
          sizes={imageSizes[size]}
        />
      )}
    </div>
  );

  const content = (
    <div
      className={cn(
        "flex items-center min-w-0",
        !imageOnly && config.spacing,
        className
      )}
    >
      {imageElement}
      {!imageOnly && (
        <span
          className={cn(
            "font-bold text-foreground truncate",
            config.text,
            textClassName
          )}
        >
          vRita AI
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group">
        {content}
      </Link>
    );
  }

  return content;
}
