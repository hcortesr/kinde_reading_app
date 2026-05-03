const plus = document.getElementById("plus");
const minus = document.getElementById("minus");
const read = document.getElementById("read");
const write = document.getElementById("write");
const readMode = document.getElementById("read_mode");
const writeMode = document.getElementById("write_mode");
const update = document.getElementById("update");
const reload = document.getElementById("reload");
const username = document.getElementById("username");

let size = 20;


update.addEventListener('click', () => {
    
    fetch('update.php', {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json'
    },
    body: JSON.stringify({
    text: write.value,
    username: username.value
    })
    })
    .then(res => res.text())
    .then(data => console.log(data));
});

reload.addEventListener('click', () => {
    
    fetch('reload.php', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username.value
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log(data);
        console.log("===");
        read.textContent = data.text;
        write.value = data.text;
    });
});

write.addEventListener('input', () => {
    read.textContent = write.value;
});

read.style.fontSize = size + "px";

readMode.addEventListener('click', () => {
    read.style.display = "block";
    write.style.display = "none";
});

writeMode.addEventListener('click', () => {
    read.style.display = "none";
    write.style.display = "block";
});

plus.addEventListener('click', () => {
    size += 3
    read.style.fontSize = size + "px";
})
minus.addEventListener('click', () => {
    size -= 3
    read.style.fontSize = size + "px";
})