document.addEventListener('DOMContentLoaded', () => {
    const colorMap = {
        0: "red",
        1: "orange",
        2: "yellow",
        3: "green",
        4: "blue",
        5: "purple",
        6: "pink",
        7: "black",
    };

    const scaleFactor = 1.2;
    let currentScale = 1;
    const manualScaleFactor = 1.25;
    const svg = document.getElementById("mySvg");
    const image = document.getElementById("hallwayImage");

    function adjustSvgSize() {
        const imageRect = image.getBoundingClientRect();
        svg.style.width = `${imageRect.width}px`;
        svg.style.height = `${imageRect.height}px`;
        svg.setAttribute("viewBox", `0 0 ${imageRect.width} ${imageRect.height}`);
    }

    function zoomCanvas(factor) {
        currentScale *= factor;
        const scaleStr = `scale(${currentScale})`;
        svg.style.transform = scaleStr;
        image.style.transform = scaleStr;
    }

    function drawArrow(num, x1, y1, x2, y2, color, pathDetails, isStart, isEnd) {
        const arrowLength = 12 * manualScaleFactor * currentScale;
        const arrowWidth = 8 * manualScaleFactor * currentScale;
        const lineWidth = 5 * manualScaleFactor * currentScale;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowX1 = x2 - arrowLength * Math.cos(angle - Math.PI / 9);
        const arrowY1 = y2 - arrowLength * Math.sin(angle - Math.PI / 9);
        const arrowX2 = x2 - arrowLength * Math.cos(angle + Math.PI / 9);
        const arrowY2 = y2 - arrowLength * Math.sin(angle + Math.PI / 9);
        const info = pathDetails.info;
        const line = createSvgElement("line", {
            x1, y1, x2, y2,
            stroke: color,
            "stroke-width": lineWidth
        });

        const arrowHead = createSvgElement("polygon", {
            points: `${x2},${y2} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`,
            fill: color
        });

        svg.appendChild(line);
        svg.appendChild(arrowHead);

        arrows.push({
            x1,
            y1,
            x2,
            y2,
            radius: 8,
            name: pathDetails.path[isStart ? 0 : num].name,
            color,
            pathDetails,
            type: isStart ? 'start' : isEnd ? 'end' : 'mid',
            info,
        });
    }

    function createSvgElement(tag, attrs) {
        const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
        for (let key in attrs) {
            element.setAttribute(key, attrs[key]);
        }
        return element;
    }

    function getMousePosition(event, svg) {
        const rect = svg.getBoundingClientRect();
        const scaleX = svg.width.baseVal.value / rect.width;
        const scaleY = svg.height.baseVal.value / rect.height;

        const svgX = (event.clientX - rect.left) * scaleX;
        const svgY = (event.clientY - rect.top) * scaleY;

        return {
            mouseX: svgX / currentScale,
            mouseY: svgY / currentScale
        };
    }

    function isMouseOverArrow(mouseX, mouseY, arrow) {
        const distance = pointToLineDistance(mouseX, mouseY, arrow.x1, arrow.y1, arrow.x2, arrow.y2);
        return distance <= arrow.radius + 6;
    }

    function pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        const param = len_sq !== 0 ? dot / len_sq : -1;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 0) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }



    function getFullPathDescription(pathDetails, start) {
        //if start is true then the given path stuff is a start, if false, it is a end
        //0 should be start 1 end
        let val = 0;
        if (start === false) {
            val = 1
        };
        console.log("Trying to get full, here's the deets: ", pathDetails)
        const fullPath = pathDetails.path.map((point, index) => `${point.name}`).join(' -> ');
        if (pathDetails.info !== null) {
            const { days, end, long_name, mods, room, semester, short_name, start, teacher } = pathDetails.info[val];
            const daysFormatted = days.join(", ");
            const modsFormatted = mods.join(", ");
            const formattedString = `
                Course: ${long_name} (${short_name})<br>
                Instructor: ${teacher}<br>
                Room: ${room}<br>
                Semester: ${semester}<br>
                Days: ${daysFormatted}<br>
                Mods: ${modsFormatted}<br>
                Start Date: ${start}<br>
                End Date: ${end}<br>
            `.trim();
            return `Route: ${fullPath}.<br><br> ${formattedString}`;
        } else {
            return `Route: ${fullPath}.`;
        }


    }

    function handleMouseMove(e) {
        const { mouseX, mouseY } = getMousePosition(e, svg);
        let tooltipVisible = false;

        arrows.forEach(arrow => {
            if (isMouseOverArrow(mouseX, mouseY, arrow)) {

                tooltip.style.display = 'block';
                tooltip.style.left = `${e.clientX + window.scrollX + 5}px`;
                tooltip.style.top = `${e.clientY + window.scrollY + 5}px`;

                let tooltipContent = `<strong>${arrow.name}</strong><br/>`;

                if (arrow.type === 'start') {
                    tooltipContent += `<em>Start of Route</em><br/>`;
                } else if (arrow.type === 'end') {
                    tooltipContent += `<em>End of Route</em><br/>`;
                }
                if (arrow.type === 'start') {
                    tooltipContent += getFullPathDescription(arrow.pathDetails, true);
                }
                if (arrow.type === 'end') {
                    tooltipContent += getFullPathDescription(arrow.pathDetails, false);
                }
                tooltip.innerHTML = `<div style="border: 1px solid ${arrow.color}; background-color: ${arrow.color};">${tooltipContent}</div>`;
                tooltipVisible = true;
            }
        });

        if (!tooltipVisible) {
            tooltip.style.display = 'none';
        }
    }

    adjustSvgSize();
    window.addEventListener('resize', adjustSvgSize);

    document.getElementById("zoomIn").addEventListener("click", () => zoomCanvas(scaleFactor));
    document.getElementById("zoomOut").addEventListener("click", () => zoomCanvas(1 / scaleFactor));

    document.addEventListener('keydown', (e) => {
        if (e.key === '+') {
            zoomCanvas(scaleFactor);
        } else if (e.key === '-') {
            zoomCanvas(1 / scaleFactor);
        }
    });

    document.getElementById('scheduleForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const scaleStr = `scale(${currentScale})`;
        svg.style.transform = scaleStr;
        image.style.transform = scaleStr;
        const scheduleInput = document.getElementById('scheduleInput').value;
        const selectedDay = document.getElementById('daySelector').value;
        const semester_type = document.getElementById('semSelector').value;
        const enter = document.getElementById('enterSelector').value;
        const exit = document.getElementById('exitSelector').value;
        const checkbox = document.getElementById('midday');
        const isChecked = checkbox.checked;

        fetch("/schedule-post", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "Schedule Input": scheduleInput, "Enter": enter, "Exit": exit, "LexMidday": isChecked }),
        })
            .then((data) => data.json())
            .then((json) => {
                console.log("Here is the json: ", json);
                if (json.status == 1) {
                    document.getElementById('error_message').innerHTML = `There was an error: ${json.error_message}`;
                    return;
                }

                const final_json = json[semester_type];
                const xShift = 5, yShift = 5;
                svg.innerHTML = '';
                arrows.length = 0;

                const curday = final_json[selectedDay];
                curday.forEach((path, curnum) => {
                    console.log("Current path: ", path)
                    const pathDetails = {
                        path: path["nodes"],
                        startName: path["nodes"][0].name,
                        endName: path["nodes"][path["nodes"].length - 1].name,
                        info: path["info"],
                    };

                    for (let i = 1; i < path["nodes"].length; i++) {
                        const startX = path["nodes"][i - 1]["x"] * manualScaleFactor * currentScale + curnum * xShift;
                        const startY = path["nodes"][i - 1]["y"] * manualScaleFactor * currentScale + curnum * yShift;
                        const endX = path["nodes"][i]["x"] * manualScaleFactor * currentScale + curnum * xShift;
                        const endY = path["nodes"][i]["y"] * manualScaleFactor * currentScale + curnum * yShift;

                        drawArrow(i, startX, startY, endX, endY, colorMap[curnum], pathDetails, i === 1, i === path.length - 1);
                    }
                });

                adjustSvgSize();
                document.getElementById('error_message').innerHTML = "";
            })

    });

    const arrows = [];
    const tooltip = document.getElementById('tooltip');

    svg.addEventListener('mousemove', handleMouseMove);
    svg.addEventListener('mouseleave', () => tooltip.style.display = 'none');
});
