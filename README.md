# Duck Hunt 3D

I and two friends designed a three-dimensional take on the original Duck Hunt game. This project let us explore our interest for 3D graphics and animation, along with game design.

Check out the game here: https://duckhunt3d.netlify.app/

<p align="center" border="none">

<a href="https://duckhunt3d.netlify.app/">
<img src="assets/duck-hunt.jpeg">
</a>
</p>

### Table of contents

1. [Introduction](#introduction)
1. [Advanced Features](#advanced-feature)
1. [Authors](#authors)
1. [References](#references)

### Introduction <a name="introduction"/>

---

<p align="center">
  <img src="https://user-images.githubusercontent.com/43663333/120747923-c00b7380-c4b6-11eb-957a-d3ccbccc6965.gif">
</p>

Duck hunt is a classic game released in 1984 by Ninetendo for the Nintendo Entertainment System. The premise of the game is that ducks appear randomly on screen and the user shoots projectiles in order to hit the ducks. We recreated the game in a 3D environment where the ducks appear at random depths and heights and the user aims using their mouse as a first-person shooter. The player gets 10 bullets and 2 extras per duck they hit.

The scene features grass composed of individual blades of **grass**, with random colors, swaying patterns and positions. In the background **trees** are randomly generated upon initialization as well. The tree's trunk and branches have different positions and directions with each scene. In addition there are 2 rocks on each side of the scene, to give a more natural feel to the scene. There is a blue **skybox** with white clouds moving across. The camera follows the position of the users mouse, and so does their **gun**. The **bullet** exits with a velocity along the axis of the gun, allowing for intuitive game play. **Ducks** spawn with random initial positions and flap their wings as they move in both directions across the player's screen. A **scoreboard** remains on the player's screen and displays how many ducks they have hit and how many bullets they have remaining. Hitting a duck gives the shooter 2 more bullets. When the player runs out of bullets the game ends.

Images of components of our scene are posted below:

**Ducks:**

![ducks_ex](https://user-images.githubusercontent.com/43663333/120742836-8e8daa80-c4ac-11eb-8cb8-b30656e1ecac.png)

**Gun:**

![gun_ex](https://user-images.githubusercontent.com/43663333/120742848-964d4f00-c4ac-11eb-82c2-1942bcb92ab0.gif)

**Grass:**

![chrome-capture](https://user-images.githubusercontent.com/43663333/120743752-74ed6280-c4ae-11eb-9716-71442dea4e25.gif)

**Trees:**

![trees_ex](https://user-images.githubusercontent.com/43663333/120742886-b1b85a00-c4ac-11eb-9971-83c643ae77a2.png)

**Skybox with Rotating Clouds:**

![chrome-capture](https://user-images.githubusercontent.com/43663333/120743342-b3cee880-c4ad-11eb-81e8-141f2111b873.gif)

**Scoreboard:**

![score_ex](https://user-images.githubusercontent.com/43663333/120742874-aa914c00-c4ac-11eb-8666-85ba0164010f.png)

**Ground Texture:**

![ground_ex](https://user-images.githubusercontent.com/43663333/120742881-aebd6980-c4ac-11eb-8096-eb76d333bf21.png)

### Advanced Features <a name="advanced-feature"/>

---

To tell whether a bullet hits a duck we implemented **collision detection**. We implemented a capsule implementation, where the duck is composed of 3 capsules. The first capsule runs along the length of the ducks body, from its beak to tail. The other two each run along a wing. The capsule method is very convenient because it can be reduced to a point-line distance problem. The spherical bullet is reduced to a point and radius, and each capsule is reduced to a line and radius. Then using the known point-line distance equation, the distance between the point and each line is calculated. If any of the distances are less than the bullet's radius plus the capsule's radius, then a collision is returned.

To make the first-person shooter experience more real we implemented **mouse picking** in our weapon. By finding the projection angle between the gun origin position and the aiming position (mouse location) we rotated the gun object the corresponding angle. To get the mouse position we added an event handler to the canvas and projected the mouse position to the camera position. Then we found the vector betweeen the gun and the mouse position, and used a rotation matrix in the appropriate axes to follow where the mouse is moving.

### References <a name="references"/>

---

#### Original Duck Hunt Game

[Screenshot:](https://www.pinterest.com/pin/356277020521935984/)

<img width="500" alt="animation" src="https://user-images.githubusercontent.com/43663333/120742094-27232b00-c4ab-11eb-90a4-11d88bf341c5.png">

#### Ducks

[Examples of resources for bird animation - Kestrel Moon Youtube Channel](https://www.youtube.com/channel/UCPqZjHnq8U1hFehOUqEmgyQ)

![animation2](https://user-images.githubusercontent.com/43663333/120742251-6a7d9980-c4ab-11eb-9a57-8312c00fc48b.jpg)

<br />

[Examples of resources for bird animation:](OpenGameArt.org)

<img width="600" alt="animation" src="https://user-images.githubusercontent.com/43663333/120742340-8d0fb280-c4ab-11eb-944f-2883dac96fc2.png">

<br />

#### Collision Detection

[Point-line distance formula:](https://www.math.kit.edu/ianm2/lehre/am22016s/media/distance-harvard.pdf)

<img width="650" alt="distance_line_point" src="https://user-images.githubusercontent.com/43663333/120760498-08339180-c4c9-11eb-9a6d-ba52f3b62635.png">

<br />

[Capsule sphere collision detection depiction:](https://arrowinmyknee.com/2021/03/15/some-math-about-capsule-collision/)

<img width="300" alt="test2" src="https://user-images.githubusercontent.com/43663333/120741677-51281d80-c4aa-11eb-8e77-6bfbd2f2eb7c.png">

#### Obj Files Used:

[Grass obj](https://github.com/petoalbert/flora/blob/gh-pages/grass.obj) (modified)

[Gun obj](https://free3d.com/3d-model/american-civil-war-pistol-n2-v1--903079.html)

[Bird obj](https://www.cgtrader.com/free-3d-models/animals/bird/vulture-3d-model-lowpoloy)

[Rock obj](https://www.cgtrader.com/items/894881/download-page)

### Authors <a name="authors"/>

---

##### Daniel Ferguson

- Email: danferg1@hotmail.com
- Github: Daniel-Ferguson1

##### Jorge De Dios Suarez

- Email: jorgdd@hotmail.com
- Github: jorgdd

##### Ian Conceicao

- Email: IanCon234@gmail.com
- Github: IanConceicao
