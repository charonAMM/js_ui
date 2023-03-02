class SelectBox {
    constructor() {
        this.getNodes();
        this.addEventListeners();
    }
    
    getNodes() {
        this.title = document.querySelector(".selectbox-title");
        this.links = Array.from(document.querySelectorAll(".selectbox-link"));
        this.resultNodes = Array.from(document.querySelectorAll(".selectbox-result"));
        this.cardNode = document.querySelector(".accordion-select .card");
    }
    
    addEventListeners() {
        this.links.map(link => link.addEventListener("click", this.changeContent.bind(this)));
    }
    
    changeContent(event) {
        event.preventDefault();
        
        const closestLink = event.target.closest("a");
        const closestLinkClone = closestLink.cloneNode(true);
        closestLinkClone.querySelector("span").remove();
        
        const iconNode = this.title.lastChild.cloneNode(true);
        
        this.title.innerHTML = closestLinkClone.textContent;
        this.title.appendChild(iconNode);
        
        this.title.click();
        
        const resultIndex = this.links.indexOf(closestLink);
        this.showResult(resultIndex);
    }
    
    showResult(index) {
        this.resultNodes.map(resultNode => resultNode.classList.remove("selectbox-result-show"));
        this.resultNodes[index].classList.add("selectbox-result-show");
        this.cardNode.classList.add("card-selected");
    }
}

const selectBox = new SelectBox();