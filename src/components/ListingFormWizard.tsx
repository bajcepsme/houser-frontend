"use client";

import * as React from "react";
import ListingPreview from "@/app/dodaj-ogloszenie/components/ListingPreview";
import ImageUploader from "@/components/ImageUploader";

type WizardMode = "create" | "edit";

type ApiImage = {
  id?: number;
  url?: string;
  order?: number;
  type?: "photo" | "floorplan";
};

type ListingData = {
  id?: number;
  title: string;
  description: string;
  price?: number;
  area?: number;
  category?: string;
  offer_type?: string;
  city?: string;
  region?: string;
  images: ApiImage[];
  floorplans: ApiImage[];
};

interface Props {
  mode: WizardMode;
  initialData?: Partial<ListingData>;
  onSubmit: (data: ListingData) => Promise<void>;
}

export default function ListingFormWizard({ mode, initialData, onSubmit }: Props) {
  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState<ListingData>({
    id: initialData?.id,
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    price: initialData?.price ?? undefined,
    area: initialData?.area ?? undefined,
    category: initialData?.category ?? "",
    offer_type: initialData?.offer_type ?? "",
    city: initialData?.city ?? "",
    region: initialData?.region ?? "",
    images: initialData?.images ?? [],         
    floorplans: initialData?.floorplans ?? [],  
  });

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleChange = (patch: Partial<ListingData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  const handleFinalSubmit = async () => {
    await onSubmit(formData);
  };

  return (
    <div className="max-w-5xl mx-auto py-6">
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{mode === "create" ? "Dodaj ogłoszenie" : "Edytuj ogłoszenie"}</h2>
          {/* Pola formularza — uproszczony przykład */}
          <input
            type="text"
            placeholder="Tytuł"
            value={formData.title}
            onChange={(e) => handleChange({ title: e.target.value })}
            className="border p-2 w-full rounded"
          />
          <textarea
            placeholder="Opis"
            value={formData.description}
            onChange={(e) => handleChange({ description: e.target.value })}
            className="border p-2 w-full rounded"
          />
          {/* Galerie zdjęć */}
          <ImageUploader
            label="Galeria zdjęć"
            type="photo"
            images={formData.images}
            onChange={(imgs) => handleChange({ images: imgs })}
          />
          <ImageUploader
            label="Rzuty pięter"
            type="floorplan"
            images={formData.floorplans}
            onChange={(imgs) => handleChange({ floorplans: imgs })}
          />
          <div className="flex justify-end gap-2">
            <button onClick={handleNext} className="px-4 py-2 bg-blue-600 text-white rounded">
              Dalej
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Podgląd</h2>
          <ListingPreview data={formData} />
          <div className="flex justify-between gap-2">
            <button onClick={handlePrev} className="px-4 py-2 bg-gray-300 rounded">
              Wróć
            </button>
            {mode === "create" ? (
              <button onClick={handleNext} className="px-4 py-2 bg-green-600 text-white rounded">
                Przejdź do cennika
              </button>
            ) : (
              <button onClick={handleFinalSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">
                Zapisz zmiany
              </button>
            )}
          </div>
        </div>
      )}

      {step === 3 && mode === "create" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Cennik i publikacja</h2>
          {/* Tutaj Twój istniejący kod z kroku cennika */}
          <div className="flex justify-between gap-2">
            <button onClick={handlePrev} className="px-4 py-2 bg-gray-300 rounded">
              Wróć
            </button>
            <button onClick={handleFinalSubmit} className="px-4 py-2 bg-green-600 text-white rounded">
              Opublikuj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
