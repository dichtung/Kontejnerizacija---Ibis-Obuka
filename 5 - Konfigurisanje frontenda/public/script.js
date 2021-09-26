const table = document.querySelector('.catsTable');
const editArea = document.querySelector('.editArea');
const editAreaHeading = document.querySelector('.editAreaTitle')
const txtBoxName = document.getElementById('catName');
const txtBoxType = document.getElementById('catType');
const txtBoxLives = document.getElementById('livesLeft');
const tableHeader = document.querySelector('.catsHeadRow');
const submitButton = document.getElementById('submitBtn');

const addNewCat = document.querySelector('.catsAddNewCatRow');

//ako je hostname onda gađam HOSTNAME
//ako je deploy-ovano negde gađamo to nešto
const hostname = window.location.host;

let targ = null;
let dataRR = null;
table.addEventListener('click', function (evt){
  targ = evt.target;
  const dataR = evt.target.closest(".catsDataRow");
  dataRR = dataR;
  let catsLives = null;
  let catName = null;
  let catType = null;
  if(!evt.target.classList.contains("addnew")){
    //Cats Lives;
    catLives = dataR.querySelector(".catLives").textContent;
    //Cat Name
    catName = dataR.querySelector(".catName").textContent;
    //Cat type
    catType = dataR.querySelector(".catType").textContent;
  }
  if(evt.target.closest("td").classList.contains("editThisCat")){
    // Logika za editovanje mačke
    editArea.classList.remove('hidden');
    txtBoxName.classList.add('txtBoxDisabled');
    txtBoxName.value = catName;
    txtBoxType.value = catType;
    txtBoxLives.value = catLives.length/2;
    submitButton.value = 'Edit cat!';
    editAreaHeading.textContent = "Edit a cat here";
    submitButton.classList.remove('addNewCatBtn');
    submitButton.classList.add('editCatBtn');
  }else if(evt.target.closest("td").classList.contains("deleteThisCat")){
    if(window.confirm('Are you sure you want to delete this cat?! Meow 😿😿😿')){
      //Deletion logic goes here:
      removeTheCat(catName);
      editArea.classList.add('hidden');
    }
  }else if (evt.target.closest("td").classList.contains("addNewCat")){
    // Logika za dodavanje nove mačke
    editArea.classList.remove('hidden');
    txtBoxName.classList.remove('txtBoxDisabled');
    txtBoxName.textContent = "";
    editAreaHeading.textContent = "Add new cat here";
    txtBoxName.value = '';
    txtBoxType.value = '';
    txtBoxLives.value = 9;
    submitButton.value = 'Add new cat!';
    submitButton.classList.add('addNewCatBtn');
    submitButton.classList.remove('editCatBtn');
  }else{
    return;
  }
});

//when clicked on submit button (either edit or add new cat)
submitButton.addEventListener("click", function(event){
  //do not
  event.preventDefault();
  //kreiranje objekta za macku
  let catObject = {
    name: txtBoxName.value,
    type: txtBoxType.value,
    lives_left: Number(txtBoxLives.value)
  };

  if(submitButton.value === 'Add new cat!'){
    //adding the new cat
    addSingleNewCat(catObject);
  }else {
    updateCat(catObject);
  }
  editArea.classList.add('hidden');
});

//Update cat
async function updateCat(catObj){
  await fetch(`http://${hostname}:5900/api/v1/cat/${catObj.name}`, {
    method: 'PUT',
    headers:{
      'Content-Type':'application/json'
    },
    body: JSON.stringify(catObj)
  })
  .then(response => response.json())
  .then(data => {
    clearCats();
    loadCats();
  })
  .catch(error => console.error(`Error occured: ${error}`));
}
//Add new cat
async function addSingleNewCat(catObj){
  await fetch(`http://${hostname}:5900/api/v1/cat`, {
    method: 'POST',
    headers:{
      'Content-Type':'application/json'
    },
    body: JSON.stringify(catObj)
  })
  .then(response => response.json())
  .then(data => {
    clearCats();
    loadCats();
  })
  .catch(error => console.error(`Error occured: ${error}`));
}

//Remove the selected Cat
async function removeTheCat(catName){
  await fetch(`http://${hostname}:5900/api/v1/cat/${catName}`, {
    method: 'DELETE', // or 'PUT'
    headers: {
      'Content-Type':'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    clearCats();
    loadCats();
  })
  .catch(error => console.error(`Error occured: ${error}`));
}

// Load all the cats from Database
async function loadCats() {
  await fetch(`http://${hostname}:5900/api/v1/cats`, {
    method: 'GET', // or 'PUT'
    headers: {
      'Accept':'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    data.forEach((object, index) => {
    addNewCat.insertAdjacentHTML('beforebegin',
    `<tr class="catsDataRow"> \
      <td class="ordinal">${index+1}</td> \
      <td class="catName">${object.name}</td> \
      <td class="catType">${object.type}</td> \
      <td class="catLives">${"🐈".repeat(object.lives_left)}</td> \
      <td class="editThisCat"><a href="#">🖍</a></td> \
      <td class="deleteThisCat"><a href="#">❌</a></td> \
    </tr>`);
    });
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}

//clear all the cats from UI
function clearCats() {
  let tableLength = table.rows.length-2;
  for(let i=tableLength ; i > 0; i--){
    table.deleteRow(i);
  }
}
