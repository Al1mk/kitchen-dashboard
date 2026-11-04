from pathlib import Path
from docx import Document
from docx.shared import Inches,Pt,RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import json
root=Path(__file__).resolve().parent
pages=json.loads((root/'booklet-content.json').read_text())
doc=Document(); sec=doc.sections[0];sec.page_width=Inches(8.5);sec.page_height=Inches(11);sec.top_margin=sec.bottom_margin=Inches(.65);sec.left_margin=sec.right_margin=Inches(.8)
for style in ['Normal','Title','Heading 1','Heading 2','Header','Footer']:
 st=doc.styles[style];st.font.name='Arial';st.font.color.rgb=RGBColor(0,0,0)
normal=doc.styles['Normal'];normal.font.size=Pt(10.5);normal.paragraph_format.space_after=Pt(7);normal.paragraph_format.line_spacing=1.1
for name,size in [('Title',21),('Heading 1',19),('Heading 2',12)]:
 st=doc.styles[name];st.font.size=Pt(size);st.paragraph_format.space_after=Pt(6);st.paragraph_format.space_before=Pt(9)
sec.header.paragraphs[0].text='LCC Campus Board   |   Aryan   |   Arbeitsentwurf zur persönlichen Prüfung'
sec.header.paragraphs[0].style='Header';sec.header.paragraphs[0].runs[0].font.size=Pt(9)
f=sec.footer.paragraphs[0];f.text='Quellenbasierter KI-unterstützter Entwurf vom 04.11.2026   |   Seite '
field=OxmlElement('w:fldSimple');field.set(qn('w:instr'),'PAGE');f._p.append(field)
for i,page in enumerate(pages):
 if i:doc.add_page_break()
 doc.add_paragraph(page['title'], 'Title' if i==0 else 'Heading 1')
 for title,body in page['sections']:
  doc.add_paragraph(title,'Heading 2');doc.add_paragraph(body)
for el in list(doc.styles.element.iter(qn('w:pBdr'))):el.getparent().remove(el)
for el in list(doc.element.iter(qn('w:pBdr'))):el.getparent().remove(el)
doc.save(root/'output/Aryan-Campuskarte-Booklet-Arbeitsentwurf.docx')
md=['# Campuskarte Arbeitsentwurf für Aryan\n\nStand 04.11.2026. Kein freigegebener persönlicher Bericht.']
for i,page in enumerate(pages):
 md.append(f'\n## Seite {i+1}  {page["title"]}\n')
 for title,body in page['sections']:md.append(f'\n### {title}\n\n{body}\n')
(root/'output/Aryan-Campuskarte-Booklet-Arbeitsentwurf.md').write_text('\n'.join(md))
