import math

def calc_y(x):
    # Clamp end values
    # If less than 4 meters away, score is 25,000
    # If more than 20,000 meters away, score is guaranteed to be 0, to make sure equation does not go into negatives
    # If in-between, Calculate formula if between clamps
    if x <= 4:
        return 25000
    elif x >= 20000:
        return 0
    else:
        return math.floor(25000 * ((1 - (x - 4) / 19996) ** 5.2))

# Few quick examples
# print(f"3m away = {calc_y(3)}")
# print(f"300m away = {calc_y(300)}")
# print(f"1000m away = {calc_y(1000)}")
# print(f"5000m away = {calc_y(5000)}")
# print(f"15000m away = {calc_y(15000)}")
# print(f"25000m away = {calc_y(25000)}")