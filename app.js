function toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");
    sidebar.classList.toggle("closed");
}

function addRow() {
    const tbody = document.getElementById("tableBody");
    let row = document.createElement("tr");

    row.innerHTML = `
        <td><input type="text"></td>
        <td><input type="text"></td>
        <td><input type="file"></td>
        <td><input type="text"></td>
        <td><input type="text"></td>
        <td><input type="number"></td>
        <td><input type="text"></td>
        <td>
            <select>
                <option>Pilih Bab...</option>
                <option>Engine</option>
                <option>Hydraulic</option>
                <option>Electrical</option>
            </select>
        </td>
        <td>
            <select>
                <option>Pilih Sub...</option>
                <option>Pump</option>
                <option>Hose</option>
                <option>Filter</option>
            </select>
        </td>
        <td><button class="hapus-btn" onclick="deleteRow(this)">Hapus</button></td>
    `;

    tbody.appendChild(row);
}

function deleteRow(button) {
    button.parentElement.parentElement.remove();
}
