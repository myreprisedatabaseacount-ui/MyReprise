export const cloudinaryLoader = ({ src, width, height, quality }: { src: string, width: number, height: number, quality: number }) => {
    const params = ['f_auto', 'c_limit', `w_${width}`, `h_${height}`, `q_${quality || "auto"}`];
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${params.join(',')}/${src}`;
};
