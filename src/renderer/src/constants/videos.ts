export interface Video {
    id: number
    title: string
    src: string
    subtitles: string
}

const basePath = window.location.protocol === 'file:' ? '.' : ''

export const defaultVideos: Video[] = [
    {
        id: 1,
        title: 'Ejercicio 1 - Estiramiento de cuello',
        src: `${basePath}/videos/ejercicio1.mp4`,
        subtitles: `${basePath}/subs/ejercicio1.vtt`
    },
    {
        id: 2,
        title: 'Ejercicio 2 - Movimientos de hombros',
        src: `${basePath}/videos/ejercicio2.mp4`,
        subtitles: ''
    },
    {
        id: 3,
        title: 'Ejercicio 3 - Estiramiento de espalda',
        src: `${basePath}/videos/ejercicio3.mp4`,
        subtitles: ''
    }
]
