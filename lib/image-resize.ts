export function redimensionarImagem(
  file: File,
  maxDimensao = 800,
  qualidade = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      if (width > maxDimensao || height > maxDimensao) {
        if (width > height) {
          height = Math.round((height * maxDimensao) / width);
          width = maxDimensao;
        } else {
          width = Math.round((width * maxDimensao) / height);
          height = maxDimensao;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Não foi possível processar a imagem."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Não foi possível processar a imagem."));
            return;
          }
          const novoNome = file.name.replace(/\.[^.]+$/, "") + ".jpg";
          resolve(new File([blob], novoNome, { type: "image/jpeg" }));
        },
        "image/jpeg",
        qualidade
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível carregar a imagem."));
    };

    img.src = url;
  });
}
