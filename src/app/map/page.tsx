import { redirect } from "next/navigation";

/** Preserve DE/EN and selected room when routing to Aryan's static navigator. */
export default async function MapPage({ searchParams }: PageProps<"/map">) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.lang === "en") query.set("lang", "en");
  if (typeof params.raum === "string" && /^K1-\d{3}[ab]?$/i.test(params.raum)) {
    query.set("raum", params.raum.toUpperCase());
  }
  redirect(`/map-demo/index.html${query.size ? `?${query}` : ""}`);
}
