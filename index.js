const {
    Engine,
    Render,
    Runner,
    World,
    Bodies,
    Body,
    MouseConstraint,
    Mouse, 
    Events
} = Matter;

const height = window.innerHeight;
const width = window.innerWidth;
const cellsHorizontal = 14;
const cellsVertical = 10;
const unitsY = height/cellsVertical;
const unitsX = width/cellsHorizontal;
const unitLength = unitsX < unitsY ? unitsX : unitsY;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width,
        height
    }
});
Render.run(render);
Runner.run(Runner.create(), engine);

// mouse
World.add(
    world,
    MouseConstraint.create(engine, {
        mouse: Mouse.create(render.canvas)
    })
);

// Walls
const walls = [
    Bodies.rectangle(width/2, 0, width, unitLength * .1, { isStatic: true }),
    Bodies.rectangle(width/2, height, width, unitLength * .1, { isStatic: true }),
    Bodies.rectangle(0, height/2, unitLength * .1, height, { isStatic: true }),
    Bodies.rectangle(width, height/2, unitLength * .1, height, { isStatic: true })
];
World.add(world, walls);

// Maze generation
const shuffle = (arr) => {
    let counter = arr.length;

    while(counter > 0) {
        const index = Math.floor(Math.random() * counter);

        counter--;

        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }

    return arr;
};

const grid = Array(cellsVertical)
    .fill(null) 
    .map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal-1).fill(false));

const horizontals = Array(cellsVertical-1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const mazePath = (row, column) => {
    // If i have visted the cell at [row, column], then return
    if(grid[row][column]) {
        return;
    }

    // Mark this cell as being visited
    grid[row][column] = true;

    // Assemble randomly-ordered list of neighbors
    const neighbors = shuffle([
        [row-1, column  , 'up'   ],
        [row  , column+1, 'right'],
        [row+1, column  , 'down' ],
        [row  , column-1, 'left' ]
    ]);

    for (let neighbor of neighbors) {
        const [nextRow, nextColumn, direction] = neighbor;
        if(
            nextRow < 0 || nextRow >= cellsVertical ||
            nextColumn < 0 || nextColumn >= cellsHorizontal ||
            grid[nextRow][nextColumn]
        ) {
            continue;
        }

        // Remove a wall from either horizontals or verticals
        if(direction == 'left') { 
            verticals[row][column-1] = true; 
        } else if(direction === 'right') { 
            verticals[row][column] = true;
        } else if(direction === 'up') {
            horizontals[row-1][column] = true;
        } else if(direction === 'down') {
            horizontals[row][column] = true;
        }

        mazePath(nextRow, nextColumn);
    }
};

mazePath(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if(open) {
            return;
        }

        const wall = Bodies.rectangle(
            columnIndex * unitsX + unitsX/2,
            rowIndex * unitsY + unitsY,
            unitsX,
            unitLength * .1,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'red'
                }
            }
        );
        World.add(world, wall);
    });
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if(open) {
            return;
        }

        const wall = Bodies.rectangle(
            columnIndex * unitsX + unitsX,
            rowIndex * unitsY + unitsY/2,
            unitLength * .1,
            unitsY,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'red'
                }
            }
        );
        World.add(world, wall);
    });
});

// goal
const goal = Bodies.rectangle(
    width - unitsX/2,
    height - unitsY/2,
    unitsX * .7,
    unitsY * .7,
    {
        label: 'goal',
        isStatic: true,
        render: {
            fillStyle: 'green'
        }
    }
);
World.add(world, goal);

// ball
const ball = Bodies.circle(
    unitsX/2,
    unitsY/2,
    unitLength/4,
    {
        label: 'ball',
        render: {
            fillStyle: 'cyan'
        }
    }
);
World.add(world, ball);

document.addEventListener('keydown', event => {
    const { x, y } = ball.velocity;
    if(event.key === 'w'|| event.key === 'ArrowUp') {
        Body.setVelocity(ball, {x, y: y-5});
    }
    if(event.key === 'a' || event.key === 'ArrowLeft') {
        Body.setVelocity(ball, {x: x-5, y});
    }
    if(event.key === 's' || event.key === 'ArrowDown') {
        Body.setVelocity(ball, {x, y: y+5});
    }
    if(event.key === 'd' || event.key === 'ArrowRight') {
        Body.setVelocity(ball, {x: x+5, y});
    }
});

// win condition
Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(collision => {
        const labels = ['ball', 'goal'];

        if (
            labels.includes(collision.bodyA.label) &&
            labels.includes(collision.bodyB.label)
        ) {
            document.querySelector('.winner').classList.remove('hidden');
            world.gravity.y = 1;
            world.bodies.forEach(body => {
                if(body.label === 'wall') {
                    Body.setStatic(body, false);
                }
            });
        }
    });
});
