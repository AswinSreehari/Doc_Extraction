import os
import sys
from pptx import Presentation
from pdf2image import convert_from_path

def convert_pptx_to_images(pptx_path, output_dir):
    # Convert pptx to PDF using LibreOffice (must be installed)
    pdf_path = os.path.join(output_dir, "temp_pptx_conversion.pdf")
    os.system(f'soffice --headless --convert-to pdf "{pptx_path}" --outdir "{output_dir}"')

    # Convert PDF to images
    images = convert_from_path(pdf_path)
    for i, img in enumerate(images):
        img_path = os.path.join(output_dir, f"slide_{i+1}.png")
        img.save(img_path, 'PNG')

    os.remove(pdf_path)

if __name__ == "__main__":
    pptx_path = sys.argv[1]
    output_dir = sys.argv[2]

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    convert_pptx_to_images(pptx_path, output_dir)
    print("DONE")
