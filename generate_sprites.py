from PIL import Image, ImageDraw

def create_pixel_sprite(size, pattern_func):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    pixels = img.load()
    for y in range(size):
        for x in range(size):
            color = pattern_func(x, y, size)
            if color:
                pixels[x, y] = color
    return img

def create_icon():
    size = 32
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for i in range(4):
        draw.rectangle([i, i, size-1-i, size-1-i], outline=(255, 215, 0, 255))
    draw.rectangle([4, 4, 15, 15], fill=(255, 100, 50, 255))
    draw.point((8, 6), (255, 200, 100, 255))
    draw.point((12, 7), (255, 220, 150, 255))
    draw.point((10, 9), (255, 180, 80, 255))
    draw.rectangle([17, 4, 28, 15], fill=(50, 150, 255, 255))
    draw.point((20, 7), (200, 230, 255, 255))
    draw.point((23, 8), (180, 220, 255, 255))
    draw.point((25, 6), (220, 240, 255, 255))
    draw.rectangle([4, 17, 15, 28], fill=(139, 90, 43, 255))
    draw.point((7, 20), (100, 70, 30, 255))
    draw.point((11, 22), (120, 80, 40, 255))
    draw.point((9, 25), (110, 75, 35, 255))
    draw.rectangle([17, 17, 28, 28], fill=(200, 255, 200, 255))
    draw.point((20, 21), (255, 255, 255, 255))
    draw.point((24, 23), (255, 255, 255, 255))
    draw.point((22, 26), (255, 255, 255, 200))
    img.save('/workspace/ElementalChaosMod/GameResources/icon.png')
    print("Icono creado: 32x32")

def create_pyromancer():
    def pattern(x, y, s):
        cx, cy = s//2, s//2
        dist = abs(x-cx) + abs(y-cy)
        if dist < 4:
            if dist < 2:
                return (255, 200, 100, 255)
            return (255, 100, 50, 255)
        if dist == 4 and (x+y) % 2 == 0:
            return (255, 150, 80, 200)
        return None
    img = create_pixel_sprite(16, pattern)
    img.save('/workspace/ElementalChaosMod/GameResources/traits/pyromancer.png')
    print("Trait Pyromancer creado")

def create_hydromancer():
    def pattern(x, y, s):
        cx, cy = s//2, s//2 - 2
        dx = x - cx
        dy = y - cy
        dist = (dx*dx + dy*dy)**0.5
        if dist < 5:
            if y < cy:
                return (100, 200, 255, 255)
            return (50, 150, 255, 255)
        if dist < 6 and y > cy + 2:
            return (50, 150, 255, 180)
        return None
    img = create_pixel_sprite(16, pattern)
    img.save('/workspace/ElementalChaosMod/GameResources/traits/hydromancer.png')
    print("Trait Hydromancer creado")

def create_geomancer():
    def pattern(x, y, s):
        cx, cy = s//2, s//2 + 2
        if 4 <= x <= 11 and 6 <= y <= 12:
            if y > 9 and abs(x-cx) < 3:
                return (100, 70, 30, 255)
            return (139, 90, 43, 255)
        if y == 5 and 6 <= x <= 9:
            return (120, 80, 40, 255)
        return None
    img = create_pixel_sprite(16, pattern)
    img.save('/workspace/ElementalChaosMod/GameResources/traits/geomancer.png')
    print("Trait Geomancer creado")

def create_aeromancer():
    def pattern(x, y, s):
        cx, cy = s//2, s//2
        dx = x - cx
        dy = y - cy
        dist = (dx*dx + dy*dy)**0.5
        angle = (x + y) % 4
        if 3 < dist < 7:
            if angle < 2:
                return (200, 255, 200, 255)
            return (255, 255, 255, 200)
        if dist < 3:
            return (220, 255, 220, 180)
        return None
    img = create_pixel_sprite(16, pattern)
    img.save('/workspace/ElementalChaosMod/GameResources/traits/aeromancer.png')
    print("Trait Aeromancer creado")

def create_inferno():
    def pattern(x, y, s):
        if 5 <= x <= 10 and 4 <= y <= 13:
            return (255, 100, 50, 255)
        if 6 <= x <= 9 and 2 <= y <= 4:
            return (255, 150, 100, 255)
        if (x == 7 or x == 8) and y == 3:
            return (255, 255, 200, 255)
        if y == 1 and 5 <= x <= 10:
            return (255, 200, 100, 200)
        return None
    img = create_pixel_sprite(16, pattern)
    img.save('/workspace/ElementalChaosMod/GameResources/heroes/inferno.png')
    print("Heroe Inferno creado")

def create_tidal():
    def pattern(x, y, s):
        if 5 <= x <= 10 and 4 <= y <= 13:
            return (50, 150, 255, 255)
        if 6 <= x <= 9 and 2 <= y <= 4:
            return (100, 180, 255, 255)
        if (x == 7 or x == 8) and y == 3:
            return (200, 240, 255, 255)
        return None
    img = create_pixel_sprite(16, pattern)
    img.save('/workspace/ElementalChaosMod/GameResources/heroes/tidal.png')
    print("Heroe Tidal creado")

def create_terra():
    def pattern(x, y, s):
        if 4 <= x <= 11 and 5 <= y <= 14:
            return (139, 90, 43, 255)
        if 5 <= x <= 10 and 2 <= y <= 5:
            return (120, 80, 40, 255)
        if (x == 6 or x == 9) and y == 3:
            return (100, 70, 30, 255)
        if (x == 3 or x == 12) and 6 <= y <= 9:
            return (110, 75, 35, 255)
        return None
    img = create_pixel_sprite(16, pattern)
    img.save('/workspace/ElementalChaosMod/GameResources/heroes/terra.png')
    print("Heroe Terra creado")

def create_zephyr():
    def pattern(x, y, s):
        if 6 <= x <= 9 and 5 <= y <= 12:
            return (200, 255, 200, 255)
        if 6 <= x <= 9 and 2 <= y <= 4:
            return (220, 255, 220, 255)
        if (x == 7 or x == 8) and y == 3:
            return (255, 255, 255, 255)
        if 3 <= x <= 12 and 6 <= y <= 10 and (x + y) % 3 == 0:
            return (255, 255, 255, 180)
        return None
    img = create_pixel_sprite(16, pattern)
    img.save('/workspace/ElementalChaosMod/GameResources/heroes/zephyr.png')
    print("Heroe Zephyr creado")

def create_burn():
    def pattern(x, y, s):
        cx, cy = s//2, s//2
        dist = abs(x-cx) + abs(y-cy)
        if dist < 5:
            if dist < 2:
                return (255, 255, 200, 255)
            return (255, 100, 50, 255)
        if dist < 7 and (x+y) % 2 == 0:
            return (255, 150, 80, 200)
        return None
    img = create_pixel_sprite(16, pattern)
    img.save('/workspace/ElementalChaosMod/GameResources/effects/burn.png')
    print("Efecto Burn creado")

def create_freeze():
    def pattern(x, y, s):
        cx, cy = s//2, s//2
        if abs(x-cx) < 2 or abs(y-cy) < 2:
            return (150, 220, 255, 255)
        if abs(x-cx) == abs(y-cy) and abs(x-cx) < 5:
            return (180, 230, 255, 255)
        if abs(x-cx) < 1 and abs(y-cy) < 1:
            return (255, 255, 255, 255)
        return None
    img = create_pixel_sprite(16, pattern)
    img.save('/workspace/ElementalChaosMod/GameResources/effects/freeze.png')
    print("Efecto Freeze creado")

def create_root():
    def pattern(x, y, s):
        cx = s//2
        if abs(x-cx) < 2 and y > 4:
            return (100, 70, 30, 255)
        if y > 8 and abs(x-cx) < 5 and (x + y) % 3 == 0:
            return (120, 80, 40, 255)
        if y < 6 and abs(x-cx) < 4:
            return (100, 180, 100, 255)
        return None
    img = create_pixel_sprite(16, pattern)
    img.save('/workspace/ElementalChaosMod/GameResources/effects/root.png')
    print("Efecto Root creado")

def create_storm():
    def pattern(x, y, s):
        cx = s//2
        if y == 2 and x == cx:
            return (255, 255, 200, 255)
        if y == 4 and abs(x-cx) < 2:
            return (255, 255, 150, 255)
        if y == 6 and abs(x-cx) < 3:
            return (255, 255, 100, 255)
        if y == 8 and abs(x-cx) < 2:
            return (255, 255, 150, 255)
        if y == 10 and x == cx:
            return (255, 255, 200, 255)
        if y < 3 and abs(x-cx) < 5:
            return (150, 150, 200, 180)
        return None
    img = create_pixel_sprite(16, pattern)
    img.save('/workspace/ElementalChaosMod/GameResources/effects/storm.png')
    print("Efecto Storm creado")

create_icon()
create_pyromancer()
create_hydromancer()
create_geomancer()
create_aeromancer()
create_inferno()
create_tidal()
create_terra()
create_zephyr()
create_burn()
create_freeze()
create_root()
create_storm()
print("\nTodos los sprites generados!")
