export const catalog = {
  "picky-kids": {
    name: "Picky Kids",
    client: "Victoria Bongiovanni",
    description: "Muebles infantiles a medida",
    furniture: {
      "mesa-y-sillas-emi": { name: "Mesa y Sillas Emi", description: "Mesa infantil y dos sillas", status: "Disponible", title: "Mesa y Sillas Emi" },
      "librero-emi": { name: "Librero Emi", description: "Librero infantil con manija", status: "Borrador", title: "Librero Emi" },
      "cama-montessori-emi": { name: "Cama Montessori Emi", description: "Cama infantil con acceso bajo y barandas", status: "Disponible", title: "Cama Montessori Emi" },
      "juguetero-bajo-x2-emi": { name: "Juguetero Bajo x2 Emi", description: "Juguetero bajo de dos compartimentos", status: "Borrador", title: "Juguetero Bajo x2 Emi" },
      "juguetero-alto": { name: "Juguetero Alto Emi", description: "Juguetero alto con cuatro estantes", status: "Disponible", title: "Juguetero Alto Emi" },
      "juguetero-x2-con-estante": { name: "Juguetero x2 con Estante", description: "Dos compartimentos y estante superior", status: "Borrador", title: "Juguetero x2 con Estante" },
      "librero-pared-emi": { name: "Librero Pared Emi", description: "Librero infantil de pared con tres niveles", status: "Borrador", title: "Librero Pared Emi" },
      "baul-emi": { name: "Baúl Emi", description: "Baúl infantil con tapa rebatible", status: "Disponible", title: "Baúl Emi" }
    }
  }
};
export const defaultClient = "picky-kids";
export const defaultFurniture = "mesa-y-sillas-emi";
export function getProduct(clientSlug, furnitureSlug) { const client=catalog[clientSlug]; const furniture=client?.furniture[furnitureSlug]; return client&&furniture?{clientSlug,furnitureSlug,client,furniture}:null; }
