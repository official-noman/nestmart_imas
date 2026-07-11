import sys
import os

try:
    import pypdf
    reader = pypdf.PdfReader("/home/noman-mahmud/Noman/project/requirements/Software Requirements Specification (SRS).pdf")
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    with open("/home/noman-mahmud/Noman/project/nestmart_imas/srs_text.txt", "w") as f:
        f.write(text)
    print("Success using pypdf")
except Exception as e:
    print("Failed pypdf:", e)

try:
    import pdfplumber
    with pdfplumber.open("/home/noman-mahmud/Noman/project/requirements/Software Requirements Specification (SRS).pdf") as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text() + "\n"
        with open("/home/noman-mahmud/Noman/project/nestmart_imas/srs_text.txt", "w") as f:
            f.write(text)
        print("Success using pdfplumber")
except Exception as e:
    print("Failed pdfplumber:", e)
