console.log("hello");
    const canvas = document.getElementsByTagName("canvas")[0];
    const context = canvas.getContext("2d");

    let nodes_array = [];
    let id_increment = 0;
    let mouse_state = true;
    let set_connection = null;

    canvas.addEventListener("mousedown", (current_click) => {
      const rect = canvas.getBoundingClientRect();
      let x = current_click.clientX - rect.left;
      let y = current_click.clientY - rect.top;
      let click_existing = false;

      for (let i = 0; i < nodes_array.length; i++) {
        let distance = Math.sqrt(Math.pow(nodes_array[i]['x'] - x, 2) + Math.pow(nodes_array[i]['y'] - y, 2))
        if (distance < 10) {
          click_existing = true;
          if (mouse_state == true) {
            set_connection = nodes_array[i];
            mouse_state = false;
          } else {
            distance = Math.sqrt(Math.pow(nodes_array[i]['x'] - set_connection['x'], 2) + Math.pow(nodes_array[i]['y'] - set_connection['y'], 2));
            nodes_array[i]['neighbor_nodes'].push([set_connection['id'], distance]);
            for (let j = 0; j < nodes_array.length; j++) {
              if (nodes_array[j]['id'] == set_connection['id']) {
                nodes_array[j]['neighbor_nodes'].push([nodes_array[i]['id'], distance]);
                context.moveTo(nodes_array[i]['x'], nodes_array[i]['y']);
                context.lineTo(nodes_array[j]['x'], nodes_array[j]['y']);
                context.strokeStyle = "green";
                context.stroke();
                mouse_state = true;
              }
            }
          }
        }
      }
      if (click_existing == true) {
        return;
      }
      context.beginPath();
      context.arc(x, y, 8, 0, 2 * Math.PI);
      context.strokeStyle = "yellow";
      context.fillStyle = "yellow";
      context.fill();
      context.stroke();
      let user_input = prompt("Node name: ");
      nodes_array.push({
        x: x,
        y: y,
        name: user_input,
        id: id_increment++,
        neighbor_nodes: []
      });
      console.log(nodes_array);
    });

    const save_nodes = () => {
      fetch("/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(nodes_array)
      }).then(data => { return data.json() })
        .then(json => { console.log(json) })
        .catch(err => { console.log(err) })
    }

    const visualize_nodes = () => {
      fetch("/assets/nodes.json")
        .then(response => response.json())
        .then(data => {

          context.clearRect(0, 0, canvas.width, canvas.height);

          data.forEach(node => {
            context.beginPath();
            context.arc(node.x, node.y, 6, 0, 2 * Math.PI);
            context.strokeStyle = "green";
            context.fillStyle = "green";
            context.fill();

            context.font = "12px Arial";
            context.fillStyle = "green";
            context.fillText(node.name, node.x + 10, node.y + 5);

            context.stroke();
          });

          data.forEach(node => {
            node.neighbor_nodes.forEach(neighbor => {
              const neighborNode = data.find(n => n.id === neighbor[0]);
              if (neighborNode) {
                context.moveTo(node.x, node.y);
                context.lineTo(neighborNode.x, neighborNode.y);
                context.strokeStyle = "green";
                context.stroke();
              }
            });
          });
        })
        .catch(err => {
          console.error("Failed to load nodes:", err);
        });
    }

    const calculate_distance = () => {
      const id1 = parseInt(document.getElementById("node1").value);
      const id2 = parseInt(document.getElementById("node2").value);

      fetch("/assets/nodes.json")
        .then(response => response.json())
        .then(data => {
          const node1 = data.find(node => node.id === id1);
          const node2 = data.find(node => node.id === id2);

          if (node1 && node2) {
            const distance = Math.sqrt(Math.pow(node2.x - node1.x, 2) + Math.pow(node2.y - node1.y, 2));
            document.getElementById("distance-output").textContent = `Distance: ${distance.toFixed(2)} pixels`;
          } else {
            document.getElementById("distance-output").textContent = "Invalid node IDs.";
          }
        })
        .catch(err => {
          console.error("Failed to load nodes:", err);
          document.getElementById("distance-output").textContent = "Error loading nodes.";
        });
    }
