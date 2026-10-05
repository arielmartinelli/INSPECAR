# Planos vectoriales originales (line-art) para Coupé y Furgón. 960x540, frente a la DERECHA en lateral_der.
S = 'fill="none" stroke="#1d1d1f" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"'
T = 'fill="none" stroke="#1d1d1f" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"'
G = 'fill="#eef2f6" stroke="#1d1d1f" stroke-width="1.8" stroke-linejoin="round"'
def svg(body, mirror=False):
    g = f'<g transform="translate(960,0) scale(-1,1)">{body}</g>' if mirror else body
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><rect width="960" height="540" fill="#fff"/>{g}</svg>'

def wheel(cx, cy, r=50, spokes=5):
    rim = r*0.68
    s = f'<circle cx="{cx}" cy="{cy}" r="{r}" {S}/><circle cx="{cx}" cy="{cy}" r="{r-6}" {T}/>'
    s += f'<circle cx="{cx}" cy="{cy}" r="{rim}" {S}/><circle cx="{cx}" cy="{cy}" r="{rim*0.28}" {T}/>'
    import math
    for i in range(spokes):
        a = 2*math.pi*i/spokes - math.pi/2
        for d in (-0.13, 0.13):
            x1 = cx + rim*0.3*math.cos(a+d*2.2); y1 = cy + rim*0.3*math.sin(a+d*2.2)
            x2 = cx + rim*0.93*math.cos(a+d); y2 = cy + rim*0.93*math.sin(a+d)
            s += f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" {T}/>'
    for i in range(5):
        a = 2*math.pi*i/5
        s += f'<circle cx="{cx+rim*0.18*math.cos(a):.1f}" cy="{cy+rim*0.18*math.sin(a):.1f}" r="1.6" fill="#1d1d1f"/>'
    return s

# ───────────────────────── COUPÉ ─────────────────────────
def coupe_side():
    gy = 440  # suelo
    rw, fw, r = 250, 712, 52
    b = ''
    # carrocería
    b += f'''<path {S} d="M 92 404 L 80 392 L 78 344 Q 78 318 100 312 L 168 300
      C 230 262 300 228 372 214 C 430 204 490 204 528 212 C 560 220 600 258 628 296
      L 822 316 Q 868 322 884 340 L 890 370 L 886 398 L 868 410
      L {fw+66} 410 A 66 66 0 0 0 {fw-66} 410 L {rw+66} 410 A 66 66 0 0 0 {rw-66} 410 Z"/>'''
    # vidrios: puerta (una sola) + ventanita trasera
    b += f'<path {G} d="M 612 298 C 586 264 560 236 526 222 C 492 214 448 214 412 220 L 418 298 Z"/>'
    b += f'<path {G} d="M 400 222 C 370 228 330 244 298 270 L 300 298 L 404 298 Z"/>'
    # línea de puerta (una puerta larga)
    b += f'<path {S} d="M 626 300 L 640 352 L 636 404 M 398 222 L 404 300 L 400 404"/>'
    b += f'<rect x="420" y="322" width="34" height="8" rx="4" {T}/>'  # manija
    # espejo
    b += f'<path {S} d="M 620 296 L 640 288 Q 652 286 650 298 L 632 304 Z"/>'
    # línea de cintura y zócalo
    b += f'<path {T} d="M 100 336 C 300 330 600 330 870 344"/><path {T} d="M {rw+70} 394 L {fw-70} 394"/>'
    # óptica delantera, parrilla, paragolpes
    b += f'<path {S} d="M 828 330 L 878 340 Q 884 352 872 356 L 838 350 Z"/><path {T} d="M 860 376 L 888 378 M 852 392 L 884 392"/>'
    # óptica trasera
    b += f'<path {S} d="M 82 326 L 120 318 L 128 334 L 84 342 Z"/><path {T} d="M 84 372 L 112 372"/>'
    # tapa de combustible, antena
    b += f'<circle cx="182" cy="330" r="9" {T}/>'
    # arcos de rueda
    for cx in (rw, fw):
        b += f'<path {T} d="M {cx-72} 410 A 72 72 0 0 1 {cx+72} 410"/>'
        b += wheel(cx, gy-r+2, r)
    b += f'<line x1="60" y1="{gy+2}" x2="900" y2="{gy+2}" stroke="#c9ced6" stroke-width="1.2"/>'
    return b

def coupe_front():
    b = ''
    b += f'''<path {S} d="M 250 400 L 246 340 Q 248 318 268 306 L 320 292 L 360 196 Q 366 184 380 182 L 580 182 Q 594 184 600 196 L 640 292 L 692 306 Q 712 318 714 340 L 710 400 L 690 424 L 270 424 Z"/>'''
    b += f'<path {G} d="M 336 288 L 372 200 L 588 200 L 624 288 Z"/>'  # parabrisas
    b += f'<path {S} d="M 278 312 L 360 312 L 352 336 L 288 336 Z"/><path {S} d="M 682 312 L 600 312 L 608 336 L 672 336 Z"/>'  # ópticas
    b += f'<path {S} d="M 392 336 L 568 336 L 556 372 L 404 372 Z"/>'  # parrilla
    for y in (346, 356, 364): b += f'<path {T} d="M {398+(y-336)*0.35} {y} L {562-(y-336)*0.35} {y}"/>'
    b += f'<rect x="440" y="386" width="80" height="20" rx="2" {T}/>'  # patente
    b += f'<path {T} d="M 270 390 L 330 386 M 690 390 L 630 386"/>'
    b += f'<path {S} d="M 268 296 L 236 292 Q 226 296 234 306 L 262 308 Z"/><path {S} d="M 692 296 L 724 292 Q 734 296 726 306 L 698 308 Z"/>'  # espejos
    b += f'<rect x="262" y="424" width="56" height="34" rx="6" {S}/><rect x="642" y="424" width="56" height="34" rx="6" {S}/>'  # cubiertas
    b += f'<line x1="220" y1="460" x2="740" y2="460" stroke="#c9ced6" stroke-width="1.2"/>'
    return b

def coupe_rear():
    b = ''
    b += f'''<path {S} d="M 252 400 L 248 342 Q 250 318 270 308 L 324 296 L 366 206 Q 372 194 386 192 L 574 192 Q 588 194 594 206 L 636 296 L 690 308 Q 710 318 712 342 L 708 400 L 688 424 L 272 424 Z"/>'''
    b += f'<path {G} d="M 344 292 L 378 212 L 582 212 L 616 292 Z"/>'  # luneta
    b += f'<path {S} d="M 272 316 L 372 312 L 368 334 L 280 338 Z"/><path {S} d="M 688 316 L 588 312 L 592 334 L 680 338 Z"/>'  # ópticas traseras
    b += f'<path {T} d="M 372 322 L 588 322"/>'  # tira entre ópticas
    b += f'<rect x="436" y="344" width="88" height="24" rx="2" {T}/>'  # patente
    b += f'<path {T} d="M 268 384 L 692 384"/><ellipse cx="330" cy="404" rx="18" ry="7" {T}/><ellipse cx="630" cy="404" rx="18" ry="7" {T}/>'  # escapes
    b += f'<path {S} d="M 272 298 L 240 294 Q 230 298 238 308 L 266 310 Z"/><path {S} d="M 688 298 L 720 294 Q 730 298 722 308 L 694 310 Z"/>'
    b += f'<rect x="264" y="424" width="56" height="34" rx="6" {S}/><rect x="640" y="424" width="56" height="34" rx="6" {S}/>'
    b += f'<line x1="220" y1="460" x2="740" y2="460" stroke="#c9ced6" stroke-width="1.2"/>'
    return b

def coupe_top():
    b = ''
    # frente a la derecha
    b += f'''<path {S} d="M 90 270 C 90 196 104 160 150 150 L 760 150 C 840 150 878 190 884 236 L 884 304 C 878 350 840 390 760 390 L 150 390 C 104 380 90 344 90 270 Z"/>'''
    b += f'<path {G} d="M 600 176 C 640 200 652 236 652 270 C 652 304 640 340 600 364 L 548 344 L 548 196 Z"/>'  # parabrisas
    b += f'<path {S} d="M 548 196 L 360 192 L 360 348 L 548 344"/>'  # techo
    b += f'<path {G} d="M 360 192 C 300 206 262 236 262 270 C 262 304 300 334 360 348 Z"/>'  # luneta
    b += f'<path {T} d="M 650 176 C 720 196 760 230 770 270 C 760 310 720 344 650 364"/>'  # capot
    b += f'<path {T} d="M 262 214 C 220 230 200 250 200 270 C 200 290 220 310 262 326"/>'  # tapa baúl
    b += f'<path {S} d="M 594 150 L 600 128 Q 606 122 614 128 L 616 150 M 594 390 L 600 412 Q 606 418 614 412 L 616 390"/>'  # espejos
    b += f'<path {T} d="M 400 150 L 404 162 L 590 166 M 400 390 L 404 378 L 590 374"/>'  # línea de puertas
    return b

# ───────────────────────── FURGÓN (techo alto) ─────────────────────────
def van_side(with_slide=True):
    gy = 458; r = 50; rw, fw = 230, 712
    b = ''
    b += f'''<path {S} d="M 92 428 L 80 418 L 78 112 Q 78 94 96 92 L 640 92 Q 676 94 690 116
      L 752 228 Q 760 240 772 244 L 852 270 Q 878 280 882 304 L 886 404 L 872 418
      L {fw+64} 418 A 64 64 0 0 0 {fw-64} 418 L {rw+64} 418 A 64 64 0 0 0 {rw-64} 418 Z"/>'''
    # parabrisas / ventana delantera
    b += f'<path {G} d="M 664 112 L 742 236 L 640 238 L 628 116 Z"/>'
    # puerta delantera
    b += f'<path {S} d="M 622 104 L 636 244 L 640 404 M 760 244 L 770 380 L 762 404"/>'
    b += f'<path {T} d="M 640 404 L 762 404"/><rect x="648" y="262" width="30" height="8" rx="4" {T}/>'
    # espejo
    b += f'<path {S} d="M 746 196 L 776 186 Q 790 186 788 200 L 784 236 L 762 240 Z"/>'
    if with_slide:
        # puerta corrediza con ventana
        b += f'<path {S} d="M 412 104 L 412 404 M 606 104 L 610 404"/><path {G} d="M 428 122 L 592 122 L 594 230 L 428 230 Z"/>'
        b += f'<path {T} d="M 412 236 L 606 236"/><rect x="430" y="262" width="30" height="8" rx="4" {T}/><path {T} d="M 92 140 L 412 140"/>'
    else:
        b += f'<path {T} d="M 410 104 L 410 404 M 606 104 L 610 404"/><path {T} d="M 92 140 L 606 140"/>'
    # paneles de carga
    b += f'<path {T} d="M 92 236 L 410 236 M 92 404 L 412 404"/>'
    # ópticas, paragolpes, parrilla
    b += f'<path {S} d="M 830 266 L 874 282 Q 880 300 866 300 L 834 290 Z"/><path {S} d="M 846 318 L 884 320 L 886 360 L 848 356 Z"/>'
    for y in (328, 338, 348): b += f'<path {T} d="M 852 {y} L 882 {y+1}"/>'
    b += f'<path {T} d="M 820 384 L 886 386"/>'
    # óptica trasera vertical + paragolpes
    b += f'<rect x="80" y="250" width="14" height="70" rx="3" {S}/><path {T} d="M 80 400 L 140 400"/>'
    # arcos y ruedas
    for cx in (rw, fw):
        b += f'<path {T} d="M {cx-72} 418 A 72 72 0 0 1 {cx+72} 418"/>'
        b += wheel(cx, gy-r+2, r, 6)
    b += f'<line x1="60" y1="{gy+2}" x2="900" y2="{gy+2}" stroke="#c9ced6" stroke-width="1.2"/>'
    return b

def van_front():
    b = ''
    b += f'''<path {S} d="M 278 418 L 274 250 Q 276 226 292 214 L 318 120 Q 324 84 360 80 L 600 80 Q 636 84 642 120 L 668 214 Q 684 226 686 250 L 682 418 L 662 436 L 298 436 Z"/>'''
    b += f'<path {G} d="M 320 212 L 344 116 Q 348 102 362 100 L 598 100 Q 612 102 616 116 L 640 212 Z"/>'  # parabrisas
    b += f'<path {T} d="M 292 214 L 668 214"/>'
    b += f'<path {S} d="M 290 236 L 372 240 L 366 278 L 296 274 Z"/><path {S} d="M 670 236 L 588 240 L 594 278 L 664 274 Z"/>'  # ópticas
    b += f'<path {S} d="M 384 238 L 576 238 L 568 312 L 392 312 Z"/>'  # parrilla
    for y in (256, 274, 292): b += f'<path {T} d="M 388 {y} L 572 {y}"/>'
    b += f'<path {T} d="M 280 330 L 680 330"/><rect x="436" y="348" width="88" height="22" rx="2" {T}/>'
    b += f'<path {T} d="M 300 392 L 380 392 M 580 392 L 660 392"/>'
    # espejos grandes
    b += f'<path {S} d="M 292 190 L 248 186 Q 236 188 236 202 L 236 250 Q 238 262 250 262 L 270 262"/>'
    b += f'<path {S} d="M 668 190 L 712 186 Q 724 188 724 202 L 724 250 Q 722 262 710 262 L 690 262"/>'
    b += f'<rect x="292" y="436" width="62" height="36" rx="6" {S}/><rect x="606" y="436" width="62" height="36" rx="6" {S}/>'
    b += f'<line x1="220" y1="474" x2="740" y2="474" stroke="#c9ced6" stroke-width="1.2"/>'
    return b

def van_rear():
    b = ''
    b += f'''<path {S} d="M 282 420 L 280 104 Q 282 82 304 80 L 656 80 Q 678 82 680 104 L 678 420 L 660 436 L 300 436 Z"/>'''
    b += f'<path {S} d="M 300 96 L 474 96 L 474 384 L 300 384 Z"/><path {S} d="M 486 96 L 660 96 L 660 384 L 486 384 Z"/>'  # puertas traseras
    b += f'<path {G} d="M 316 112 L 460 112 L 460 214 L 316 214 Z"/><path {G} d="M 500 112 L 644 112 L 644 214 L 500 214 Z"/>'  # vidrios
    b += f'<rect x="456" y="240" width="10" height="34" rx="3" {T}/>'  # manija
    b += f'<rect x="282" y="226" width="16" height="96" rx="3" {S}/><rect x="662" y="226" width="16" height="96" rx="3" {S}/>'  # ópticas
    b += f'<path {S} d="M 286 392 L 674 392 L 670 420 L 290 420 Z"/><rect x="436" y="398" width="88" height="18" rx="2" {T}/>'  # paragolpes/patente
    b += f'<rect x="440" y="84" width="80" height="8" rx="2" {T}/>'  # 3er stop
    b += f'<rect x="300" y="436" width="62" height="36" rx="6" {S}/><rect x="598" y="436" width="62" height="36" rx="6" {S}/>'
    b += f'<line x1="220" y1="474" x2="740" y2="474" stroke="#c9ced6" stroke-width="1.2"/>'
    return b

def van_top():
    b = ''
    b += f'''<path {S} d="M 80 150 Q 80 136 94 136 L 760 136 C 846 140 884 176 888 236 L 888 304 C 884 364 846 400 760 404 L 94 404 Q 80 404 80 390 Z"/>'''
    b += f'<path {G} d="M 700 158 C 740 190 752 230 752 270 C 752 310 740 350 700 382 L 676 368 L 676 172 Z"/>'  # parabrisas
    b += f'<path {T} d="M 752 166 C 820 190 852 230 856 270 C 852 310 820 350 752 374"/>'  # capot
    b += f'<path {S} d="M 96 152 L 676 152 L 676 388 L 96 388 Z"/>'  # techo
    for x in range(150, 660, 64): b += f'<path {T} d="M {x} 160 L {x} 380"/>'  # nervaduras del techo
    b += f'<path {T} d="M 92 270 L 100 270"/>'
    b += f'<path {S} d="M 690 136 L 690 104 Q 700 96 712 104 L 714 136 M 690 404 L 690 436 Q 700 444 712 436 L 714 404"/>'  # espejos
    return b

import os
os.makedirs('out', exist_ok=True)
files = {
 'coupe_lateral_der': svg(coupe_side()), 'coupe_lateral_izq': svg(coupe_side(), True),
 'coupe_frente': svg(coupe_front()), 'coupe_trasera': svg(coupe_rear()), 'coupe_techo': svg(coupe_top()),
 'furgon_lateral_der': svg(van_side(True)), 'furgon_lateral_izq': svg(van_side(False), True),
 'furgon_frente': svg(van_front()), 'furgon_trasera': svg(van_rear()), 'furgon_techo': svg(van_top()),
}
for k,v in files.items(): open(f'out/{k}.svg','w').write(v)
print('ok', len(files))
