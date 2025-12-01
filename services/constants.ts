import { ArtStyle } from '../types';

export const ART_STYLES: ArtStyle[] = [
  {
    id: 'cyberpunk',
    label: '赛博朋克 (Cyberpunk)',
    positivePrompt: 'cyberpunk style, neon lights, high contrast, futuristic city, rain, wet streets, chromatic aberration, masterpiece, best quality, 8k',
    negativePrompt: 'natural light, sunshine, rustic, vintage, low quality, blurry',
  },
  {
    id: 'anime_jp',
    label: '日系动画 (Japanese Anime)',
    positivePrompt: 'anime style, makoto shinkai style, vibrant colors, detailed clouds, lens flare, beautiful lighting, 2d, flat color, masterpiece',
    negativePrompt: 'photorealistic, 3d, render, western comic style, lowres',
  },
  {
    id: 'pixar_3d',
    label: '皮克斯 3D (Pixar Style)',
    positivePrompt: '3d render, pixar style, disney style, cute, expressive faces, subsurface scattering, ambient occlusion, bright lighting, soft shadows, 4k, cgsociety',
    negativePrompt: '2d, sketch, anime, rough, dark, horror',
  },
  {
    id: 'film_noir',
    label: '胶片电影 (Film Noir)',
    positivePrompt: 'cinematic film still, film noir, black and white, dramatic lighting, shadow play, grain, analog photography, leica, 35mm',
    negativePrompt: 'color, cartoon, anime, 3d render, digital art, oversaturated',
  },
  {
    id: 'chinese_ink',
    label: '水墨国风 (Chinese Ink)',
    positivePrompt: 'chinese ink painting style, watercolor, traditional art, wash painting, calligraphy strokes, elegant, minimalist, mountains, fog',
    negativePrompt: 'photorealistic, cyberpunk, neon, 3d, vibrant colors',
  },
  {
    id: 'custom',
    label: '自定义 (Custom)',
    positivePrompt: '',
    negativePrompt: '',
  }
];
