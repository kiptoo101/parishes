import matplotlib.pyplot as plt
import matplotlib.image as mpimg
import numpy as np

# Read the image
img = mpimg.imread('cathedral-icon.png')

# Create a mask for black pixels
mask = (img[:,:,0] < 0.1) & (img[:,:,1] < 0.1) & (img[:,:,2] < 0.1)

# Create a new image, starting with the original
yellow_img = img.copy()

# For all pixels in the mask, set to yellow
yellow_img[mask, 0] = 1.0  # Red channel at full
yellow_img[mask, 1] = 0.843  # Green channel for golden yellow
yellow_img[mask, 2] = 0.0  # No blue for yellow

# Save the new image
plt.imsave('yellow-cathedral-icon.png', yellow_img)