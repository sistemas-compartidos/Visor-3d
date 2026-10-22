const route = new URLSearchParams(location.search);
if (route.get('mueble') === 'librero-emi') import('./librero_v2.js');
else if (route.get('mueble') === 'cama-montessori-emi') import('./cama.js');
else if (route.get('mueble') === 'juguetero-bajo-x2-emi') import('./juguetero.js');
else if (route.get('mueble') === 'juguetero-alto') import('./juguetero_alto.js');
else if (route.get('mueble') === 'juguetero-x2-con-estante') import('./juguetero_estante.js');
else if (route.get('mueble') === 'librero-pared-emi') import('./librero_pared.js');
else if (route.get('mueble') === 'baul-emi') import('./baul.js');
else import('./mesa.js');
