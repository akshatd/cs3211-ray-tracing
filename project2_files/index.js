// # GPU Aceelerated Raytracing

// # Setup
var mainCanvas = document.getElementById('mainCanvas'),
    width = 800 * 0.5,
    height = 800 * 0.5;

mainCanvas.width = width;
mainCanvas.height = height;
mainCanvas.style.cssText = 'width:' + (width * 2) + 'px;height:' + (height*2) + 'px';
var ctx = mainCanvas.getContext('2d'),
    data = ctx.getImageData(0, 0, width, height);

// # Throwing Rays
function render(scene) {
    // first 'unpack' the scene to make it easier to reference
    var camera = scene.camera,
        objects = scene.objects,
        lights = scene.lights;

    // var eyeVector = Vector.unitVector(Vector.subtract(camera.vector, camera.point)),
    //     vpRight = Vector.unitVector(Vector.crossProduct(eyeVector, Vector.UP)),
    //     vpUp = Vector.unitVector(Vector.crossProduct(vpRight, eyeVector));

    var eyeVector, vpRight, vpUp;
    // subtract
    var eyeVector_x = camera.vector.x - camera.point.x,
        eyeVector_y = camera.vector.y - camera.point.y,
        eyeVector_z = camera.vector.z - camera.point.z;
    // unit vector
    var eyeVector_len = Vector_length(eyeVector_x,eyeVector_y,eyeVector_z);
        eyeVector_x /= eyeVector_len;
        eyeVector_y /= eyeVector_len;
        eyeVector_z /= eyeVector_len;
    eyeVector = {x:eyeVector_x, y:eyeVector_y, z:eyeVector_z};
   
    // cross product
    var vpRight_x = (eyeVector.y * Vector.UP.z) - (eyeVector.z * Vector.UP.y),
        vpRight_y = (eyeVector.z * Vector.UP.x) - (eyeVector.x * Vector.UP.z),
        vpRight_z = (eyeVector.x * Vector.UP.y) - (eyeVector.y * Vector.UP.x);
    // unit vector
    var vpRight_len = Vector_length(vpRight_x,vpRight_y,vpRight_z);
        vpRight_x /= vpRight_len;
        vpRight_y /= vpRight_len;
        vpRight_z /= vpRight_len;
    vpRight = {x:vpRight_x, y:vpRight_y, z:vpRight_z};
    
    // cross product
    var vpUp_x = (vpRight.y * eyeVector.z) - (vpRight.z * eyeVector.y),
        vpUp_y =  (vpRight.z * eyeVector.x) - (vpRight.x * eyeVector.z),
        vpUp_z =  (vpRight.x * eyeVector.y) - (vpRight.y * eyeVector.x);
    // unit vector
    var vpUp_len = Vector_length(vpUp_x,vpUp_y,vpUp_z);
        vpUp_x /= vpUp_len;
        vpUp_y /= vpUp_len;
        vpUp_z /= vpUp_len;
    vpUp = {x:vpUp_x, y:vpUp_y, z:vpUp_z};

    var fovRadians = Math.PI * (camera.fieldOfView / 2) / 180,
        heightWidthRatio = height / width,
        halfWidth = Math.tan(fovRadians),
        halfHeight = heightWidthRatio * halfWidth,
        camerawidth = halfWidth * 2,
        cameraheight = halfHeight * 2,
        pixelWidth = camerawidth / (width - 1),
        pixelHeight = cameraheight / (height - 1);

    var index, color;
    var ray = {
        point: camera.point
    };
    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {

            // var xcomp = Vector.scale(vpRight, (x * pixelWidth) - halfWidth),
            //     ycomp = Vector.scale(vpUp, (y * pixelHeight) - halfHeight);

            // ray.vector = Vector.unitVector(Vector.add3(eyeVector, xcomp, ycomp));
            
            var xcomp, ycomp;

            // scale
            var xfactor = (x * pixelWidth) - halfWidth,
                xcomp_x = vpRight_x * xfactor,
                xcomp_y = vpRight_y * xfactor,
                xcomp_z = vpRight_z * xfactor;
            xcomp = {x:xcomp_x, y:xcomp_y, z:xcomp_z};

            // scale
            var yfactor = (y * pixelHeight) - halfHeight,
                ycomp_x = vpUp_x * yfactor,
                ycomp_y = vpUp_y * yfactor,
                ycomp_z = vpUp_z * yfactor;
            ycomp = {x:ycomp_x, y:ycomp_y, z:ycomp_z};

            // add
            var ray_v_x = eyeVector_x + xcomp_x + ycomp_x,
                ray_v_y = eyeVector_y + xcomp_y + ycomp_y,
                ray_v_z = eyeVector_z + xcomp_z + ycomp_z;
            // unit vector
            var ray_v_len = Vector_length(ray_v_x,ray_v_y,ray_v_z);
                ray_v_x /= ray_v_len;
                ray_v_y /= ray_v_len;
                ray_v_z /= ray_v_len;
            ray.vector = {x:ray_v_x, y:ray_v_y, z:ray_v_z};

            color = trace(ray, scene, 0);

            index = (x * 4) + (y * width * 4),
            data.data[index + 0] = color.x;
            data.data[index + 1] = color.y;
            data.data[index + 2] = color.z;
            data.data[index + 3] = 255;
        }
    }
    ctx.putImageData(data, 0, 0);
}

// # Trace
function trace(ray, scene, depth) {
    if (depth > 3) return;

    var distObject = intersectScene(ray, scene);

    if (distObject[0] === Infinity) {
        return Vector.WHITE;
    }

    var dist = distObject[0],
        object = distObject[1];

    // var pointAtTime = Vector.add(ray.point, Vector.scale(ray.vector, dist));
    var pointAtTime, pointAtTime_x, pointAtTime_y, pointAtTime_z;
    // scaling first
        pointAtTime_x = ray.vector.x * dist;
        pointAtTime_y = ray.vector.y * dist;
        pointAtTime_z = ray.vector.z * dist;
    //adding
        pointAtTime_x += ray.point.x;
        pointAtTime_y += ray.point.y;
        pointAtTime_z += ray.point.z;
    pointAtTime = {x:pointAtTime_x, y:pointAtTime_y, z:pointAtTime_z};

    // calculating sphere normal first
    var sphr_normal, sphr_normal_x, sphr_normal_y, sphr_normal_z;
        //     return Vector.unitVector(Vector.subtract(b, a.point));
        // subtract
        sphr_normal_x = pointAtTime_x - object.point.x;
        sphr_normal_y = pointAtTime_y - object.point.y;
        sphr_normal_z = pointAtTime_z - object.point.z;
        // unit vector
    var sphr_normal_len = Vector_length(sphr_normal_x,sphr_normal_y,sphr_normal_z);
        sphr_normal_x /= sphr_normal_len;
        sphr_normal_y /= sphr_normal_len;
        sphr_normal_z /= sphr_normal_len;
    sphr_normal = {x:sphr_normal_x, y:sphr_normal_y, z:sphr_normal_z};

    return surface(ray, scene, object, pointAtTime, sphr_normal, depth);
    
    // return surface(ray, scene, object, pointAtTime, sphereNormal(object, pointAtTime), depth);
}

// # Detecting collisions against all objects
function intersectScene(ray, scene) {

    var closest = [Infinity, null];

    for (var i = 0; i < scene.objects.length; i++) {
        var object = scene.objects[i],
            dist = sphereIntersection(object, ray);
        if (dist !== undefined && dist < closest[0]) {
            closest = [dist, object];
        }
    }
    return closest;
}

// ## Detecting collisions against a sphere
function sphereIntersection(sphere, ray) {
    // var eye_to_center = Vector.subtract(sphere.point, ray.point),
    var eye_to_center,
    // subtract
        eye_to_center_x = sphere.point.x - ray.point.x,
        eye_to_center_y = sphere.point.y - ray.point.y,
        eye_to_center_z = sphere.point.z - ray.point.z;
    eye_to_center = {x:eye_to_center_x, y:eye_to_center_y, z:eye_to_center_z};

    var v = Vector_dotProduct(eye_to_center.x, eye_to_center.y, eye_to_center.z,
            ray.vector.x, ray.vector.y, ray.vector.z),
        eoDot = Vector_dotProduct(eye_to_center.x, eye_to_center.y, eye_to_center.z,
                eye_to_center.x, eye_to_center.y, eye_to_center.z),
        discriminant = (sphere.radius * sphere.radius) - eoDot + (v * v);
    if (discriminant < 0) {
        return;
    } else {
        return v - Math.sqrt(discriminant);
    }
}

// function sphereNormal(a, b) {
//     return Vector.unitVector(
//         Vector.subtract(b, a.point));
// }

// # Surface
function surface(ray, scene, object, pointAtTime, normal, depth) {
    var b = object.color,
        c = Vector.ZERO,
        lambertAmount = 0;

    if (object.lambert) {
        for (var i = 0; i < scene.lights.length; i++) {
            var lightPoint = scene.lights[0];

            if (!isLightVisible(pointAtTime, scene, lightPoint)) continue;
            var contribution = Vector.dotProduct(Vector.unitVector(
                Vector.subtract(lightPoint, pointAtTime)), normal);

            if (contribution > 0) lambertAmount += contribution;
        }
    }

    if (object.specular) {
        var reflectedRay = {
            point: pointAtTime,
            vector: Vector.reflectThrough(ray.vector, normal)
        };
        var reflectedColor = trace(reflectedRay, scene, ++depth);
        if (reflectedColor) {
            c = Vector.add(c, Vector.scale(reflectedColor, object.specular));
        }
    }

    lambertAmount = Math.min(1, lambertAmount);

    return Vector.add3(c,
        Vector.scale(b, lambertAmount * object.lambert),
        Vector.scale(b, object.ambient));
}

function isLightVisible(pt, scene, light) {
    var distObject =  intersectScene({
        point: pt,
        vector: Vector.unitVector(Vector.subtract(pt, light))
    }, scene);
    return distObject[0] > -0.005;
}

var planet1 = 0,
    planet2 = 0;

var f = document.querySelector("#fps");
function renderLoop() {
    // make one planet spin a little bit faster than the other, just for
    // effect.
    planet1 += 0.05;
    planet2 += 0.08;

    // set the position of each moon with some trig.
    scene.objects[1].point.x = Math.sin(planet1) * 3.5;
    scene.objects[1].point.y = Math.cos(planet1) * 3.5;
    scene.objects[1].point.z = -3 + (Math.cos(planet1) * 3.5);

    scene.objects[2].point.x = Math.sin(planet2) * 4;
    scene.objects[2].point.z = -3 + (Math.cos(planet2) * 4);

    // finally, render the scene!
    render(scene);

    //get the FPS
    f.innerHTML = fps.getFPS();

    // and as soon as we're finished, render it again and move the planets
    // again
    setTimeout(renderLoop, 1);
}

window.onload = renderLoop;

//stooopid functions
var selection = 0;

function boost( element ) {
  if ( element.value == "Using CPU" ) {
     selection = 1;
     element.value = "Using GPU";
  } else {
     selection = 0;
     element.value = "Using CPU";
  }
}