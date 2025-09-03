from PIL import Image, ImageDraw
import os

# Create a simple 512x512 icon
size = 512
img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Draw a simple "M" for MarkReview
margin = 80
width = size - 2 * margin
height = size - 2 * margin

# Background circle
draw.ellipse([margin, margin, size - margin, size - margin], fill='#4A90E2')

# Draw "M" letter
text_color = 'white'
# Simple M shape using polygons
m_width = width * 0.7
m_height = height * 0.6
m_x = (size - m_width) // 2
m_y = (size - m_height) // 2 + 20

# Left vertical line
draw.rectangle([m_x, m_y, m_x + 40, m_y + m_height], fill=text_color)
# Right vertical line  
draw.rectangle([m_x + m_width - 40, m_y, m_x + m_width, m_y + m_height], fill=text_color)
# Left diagonal
draw.polygon([
    (m_x + 40, m_y),
    (m_x + 40 + 30, m_y),
    (m_x + m_width // 2, m_y + m_height // 2),
    (m_x + m_width // 2 - 20, m_y + m_height // 2)
], fill=text_color)
# Right diagonal
draw.polygon([
    (m_x + m_width - 70, m_y),
    (m_x + m_width - 40, m_y),
    (m_x + m_width // 2 + 20, m_y + m_height // 2),
    (m_x + m_width // 2, m_y + m_height // 2)
], fill=text_color)

img.save('app-icon.png')
print("Created app-icon.png")