"use client";

import { useState } from "react";
import Image from "next/image";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex h-[280px] w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#F0E6D4] md:h-[520px] md:w-[520px]" />
    );
  }

  return (
    <div className="flex w-full shrink-0 flex-col gap-3 md:w-[520px]">
      <div className="flex h-[280px] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#F0E6D4] md:h-[520px]">
        <Image
          src={images[selected]}
          alt={alt}
          width={520}
          height={520}
          className="h-full w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setSelected(i)}
              className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                i === selected ? "border-[#5A4738]" : "border-[#D8CDBC]"
              }`}
              aria-label={`Ver foto ${i + 1}`}
            >
              <Image
                src={url}
                alt=""
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
