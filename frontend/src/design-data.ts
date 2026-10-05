export const photo = (index = 0) =>
  "/images/design/food-" + (((index % 4) + 4) % 4) + ".webp";
export const photoSet = (url: string) =>
  /^\/images\/design\/food-[0-3]\.webp$/.test(url)
    ? `${url.replace(".webp", "-400.webp")} 400w, ${url.replace(".webp", "-700.webp")} 700w`
    : undefined;
export const photoDimensions = (url: string) => {
  const match = url.match(/^\/images\/design\/food-([0-3])(?:-\d+)?\.webp$/);
  return match ? [[1000, 653], [1000, 667], [1000, 1500], [1000, 611]][Number(match[1])] : [1000, 700];
};
export type Item = {
  id: number;
  name: string;
  price: number;
  category: string;
  available: boolean;
  description: string;
  featured: boolean;
  spicy: boolean;
  veg: boolean;
  image?: string;
  images?: string[];
};
