/* Datos de obras. Sustituir/ampliar cuando se disponga del documento
   "RELACIÓN DE OBRAS" con los textos definitivos de cada pieza. */

const ARTWORKS = [
  {
    id: 'obra-01',
    image: 'assets/images/obra-01.jpg',
    name: { es: 'Eclipse dorado', en: 'Golden Eclipse' },
    technique: { es: 'Técnica mixta sobre lienzo', en: 'Mixed media on canvas' },
    measures: '190 x 180 cm',
    sold: true
  },
  {
    id: 'obra-02',
    image: 'assets/images/obra-02.jpg',
    name: { es: 'Trazo en negro', en: 'Black Stroke' },
    technique: { es: 'Técnica mixta sobre papel', en: 'Mixed media on paper' },
    measures: '110 x 75 cm',
    sold: false
  },
  {
    id: 'grabado-01',
    image: 'assets/images/grabado-01.jpg',
    name: { es: 'Círculo velado', en: 'Veiled Circle' },
    technique: { es: 'Grabado y técnica mixta sobre papel', en: 'Etching and mixed media on paper' },
    measures: '57 x 57 cm',
    sold: false
  },
  {
    id: 'obra-03',
    image: 'assets/images/obra-03.jpg',
    name: { es: 'Fragmento solar', en: 'Solar Fragment' },
    technique: { es: 'Acrílico y grafito sobre lienzo', en: 'Acrylic and graphite on canvas' },
    measures: '210 x 145 cm',
    sold: false
  },
  {
    id: 'obra-04',
    image: 'assets/images/obra-04.jpg',
    name: { es: 'Palimpsesto', en: 'Palimpsest' },
    technique: { es: 'Técnica mixta y collage sobre papel', en: 'Mixed media and collage on paper' },
    measures: '100 x 100 cm',
    sold: false
  },
  {
    id: 'grabado-02',
    image: 'assets/images/grabado-02.jpg',
    name: { es: 'Enredo', en: 'Tangle' },
    technique: { es: 'Monotipo y collage sobre papel', en: 'Monotype and collage on paper' },
    measures: '80 x 80 cm',
    sold: false
  },
  {
    id: 'grabado-03',
    image: 'assets/images/grabado-03.jpg',
    name: { es: 'Las raíces abrazan la tierra', en: 'The Roots Embrace the Earth' },
    technique: { es: 'Aguafuerte sobre papel', en: 'Etching on paper' },
    measures: '70 x 60 cm',
    sold: false
  }
];

/* Home/Obra show a paginated grid. Until the full "RELACIÓN DE OBRAS"
   list is available, this repeats the real pieces above to demonstrate
   the pagination — replace with the real, distinct catalogue later. */
function buildRepeatedArtworks(source, total) {
  const out = [];
  for (let i = 0; i < total; i++) {
    const base = source[i % source.length];
    out.push(Object.assign({}, base, { id: base.id + '-p' + i }));
  }
  return out;
}

const ARTWORKS_ALL = buildRepeatedArtworks(ARTWORKS, 36);

/* Selección curada para la sección "Obra destacada" de la home:
   la primera pieza se muestra a todo lo ancho, el resto en filas de 3. */
const DESTACADAS = [
  {
    id: 'destacada-00',
    image: 'assets/images/destacada-00.jpg',
    name: { es: 'Memoria de espacios', en: 'Memory of Spaces' },
    technique: { es: 'Técnica mixta y collage sobre papel', en: 'Mixed media and collage on paper' },
    measures: '50 x 340 cm',
    sold: false
  },
  {
    id: 'destacada-01',
    image: 'assets/images/destacada-01.jpg',
    name: { es: 'Trazo rojo', en: 'Red Stroke' },
    technique: { es: 'Técnica mixta sobre papel', en: 'Mixed media on paper' },
    measures: '100 x 75 cm',
    sold: false
  },
  {
    id: 'destacada-02',
    image: 'assets/images/destacada-02.jpg',
    name: { es: 'Círculo azul', en: 'Blue Circle' },
    technique: { es: 'Técnica mixta sobre lienzo', en: 'Mixed media on canvas' },
    measures: '150 x 140 cm',
    sold: false
  },
  {
    id: 'destacada-03',
    image: 'assets/images/destacada-03.jpg',
    name: { es: 'Círculo en negro', en: 'Circle in Black' },
    technique: { es: 'Acrílico sobre lienzo', en: 'Acrylic on canvas' },
    measures: '150 x 150 cm',
    sold: false
  },
  {
    id: 'destacada-05',
    image: 'assets/images/destacada-05.jpg',
    name: { es: 'Composición en rojo y amarillo', en: 'Composition in Red and Yellow' },
    technique: { es: 'Técnica mixta y collage sobre papel', en: 'Mixed media and collage on paper' },
    measures: '100 x 70 cm',
    sold: false
  },
  {
    id: 'destacada-04',
    image: 'assets/images/destacada-04.jpg',
    name: { es: 'Círculo dorado', en: 'Golden Circle' },
    technique: { es: 'Técnica mixta sobre lienzo', en: 'Mixed media on canvas' },
    measures: '195 x 130 cm',
    sold: false
  },
  {
    id: 'destacada-06',
    image: 'assets/images/destacada-06.jpg',
    name: { es: 'Encuentro azul', en: 'Blue Encounter' },
    technique: { es: 'Tinta y acrílico sobre papel', en: 'Ink and acrylic on paper' },
    measures: '90 x 100 cm',
    sold: false
  }
];

const GRABADOS = [
  {
    id: 'grabado-01',
    image: 'assets/images/grabado-01.jpg',
    name: { es: 'Círculo velado', en: 'Veiled Circle' },
    technique: { es: 'Grabado y técnica mixta sobre papel', en: 'Etching and mixed media on paper' },
    measures: '57 x 57 cm',
    sold: false
  },
  {
    id: 'grabado-02',
    image: 'assets/images/grabado-02.jpg',
    name: { es: 'Enredo', en: 'Tangle' },
    technique: { es: 'Monotipo y collage sobre papel', en: 'Monotype and collage on paper' },
    measures: '80 x 80 cm',
    sold: false
  },
  {
    id: 'grabado-03',
    image: 'assets/images/grabado-03.jpg',
    name: { es: 'Las raíces abrazan la tierra', en: 'The Roots Embrace the Earth' },
    technique: { es: 'Aguafuerte sobre papel', en: 'Etching on paper' },
    measures: '70 x 60 cm',
    sold: false
  }
];

const EXHIBITIONS = [
  {
    id: 'expo-01',
    image: 'assets/images/expo-01.jpg',
    name: { es: 'Visita a la exposición', en: 'Visitors at the exhibition' },
    technique: { es: '', en: '' },
    measures: '',
    sold: false
  },
  {
    id: 'expo-02',
    image: 'assets/images/expo-02.jpg',
    name: { es: 'Montaje de la obra en sala', en: 'Installing the work in the gallery' },
    technique: { es: '', en: '' },
    measures: '',
    sold: false
  },
  {
    id: 'expo-03',
    image: 'assets/images/expo-03.jpg',
    name: { es: 'Público ante la obra gráfica', en: 'Visitors viewing the graphic work' },
    technique: { es: '', en: '' },
    measures: '',
    sold: false
  },
  {
    id: 'expo-04',
    image: 'assets/images/expo-04.jpg',
    name: { es: 'Presentación del proyecto expositivo «Poiesis»', en: 'Presentation of the exhibition project «Poiesis»' },
    technique: { es: '', en: '' },
    measures: '',
    sold: false
  },
  {
    id: 'expo-05',
    image: 'assets/images/expo-05.jpg',
    name: { es: 'Inauguración de la exposición', en: 'Exhibition opening' },
    technique: { es: '', en: '' },
    measures: '',
    sold: false
  }
];
