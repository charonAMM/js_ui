<!--
*** Thanks for checking out the Best-README-Template. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Thanks again! Now go create something AMAZING! :D
***
***
***
*** To avoid retyping too much info. Do a search and replace for the following:
*** github_username, repo_name, twitter_handle, email, project_title, project_description
-->



<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]


<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/tellor-io/votingModule">
    <img src="/public/Tellor_TRB.svg" alt="Logo" width="80" height="80">
  </a>

  <h2 align="center">Tellor Voting Module</h2>

  <p align="center">
    This project is a reusable voting interface for Tellor upgrades, Tellor treasuries and other community governance votes. Just update the description on what community members are voting on, as well as the votingID (coming from a Solidity contract) to be voted on, located at line 25 && 26 under src/components/Hero.js, depending on the chain where the vote is happening.
    <br />
    <br />
    <a href="https://github.com/tellor-io/votingModule/issues">Report Bug</a>
    ·
    <a href="https://github.com/tellor-io/votingModule/issues">Request Feature</a>
  </p>
</p>



<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary><h2 style="display: inline-block">Table of Contents</h2></summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#built-with">Built With</a></li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
  </ol>
</details>

## About The Project
<div>
  <img src="https://user-images.githubusercontent.com/21370350/165320540-80943ab0-be96-4ce1-bfe1-5dfd779cabea.png" alt="Project example" width="30%" height="100%">
  <img src="https://user-images.githubusercontent.com/21370350/165320605-f9c82470-35fb-47fc-89a2-c361c9d5cc26.png" alt="Project example" width="30%" height="100%">
  <img src="https://user-images.githubusercontent.com/21370350/165320664-340a3e99-bc46-4105-8827-8c24d916dd17.png" alt="Project example" width="30%" height="100%">
</div>


### Built With

* [React](https://reactjs.org/)
* [web3](https://web3js.readthedocs.io/en/v1.7.3/)
* [ethers.js](https://docs.ethers.io/v5/)
* [jazzicon-react](https://www.npmjs.com/package/@ukstv/jazzicon-react)
* [Semantic UI](https://semantic-ui.com/)

<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

* This app requires node version **14.4.0** in order to run.
* We suggest installing nvm globally
  ```sh
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
  ```
* Check nvm version after install
  ```sh
  nvm -v 
  ```
  Ex:
  ```sh
  0.39.1
  ```

### Installation

1. Clone the repo in your preferred directory
   ```sh
   git clone https://github.com/tellor-io/votingModule.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Change node version to 14.4.0
   ```sh
   nvm use v14.4.0
   ```
   Output:
   ```sh
   Now using node v14.4.0 (npm v6.14.5)
   ```
4. Spin up your local development server
   ```sh
   npm start
   ```

<!-- ROADMAP -->
## Roadmap

See the [open issues](https://github.com/tellor-io/votingModule/issues) for a list of proposed features (and known issues).

<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

<!-- CONTACT -->
## Contact

Tellor.io 
- [Documentation](https://docs.tellor.io/tellor/)
- [Twitter](https://twitter.com/WeAreTellor)
- [Discord](https://discord.gg/NP7fmzr5)
- [GitHub](https://github.com/tellor-io)
- [YouTube](https://www.youtube.com/tellor)

<!-- ACKNOWLEDGEMENTS -->

## Acknowledgements

* [README Acknowledgement](https://github.com/othneildrew/Best-README-Template)

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/tellor-io/votingModule.svg?style=for-the-badge
[contributors-url]: https://github.com/tellor-io/votingModule/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/tellor-io/votingModule.svg?style=for-the-badge
[forks-url]: https://github.com/tellor-io/votingModule/network/members
[stars-shield]: https://img.shields.io/github/stars/tellor-io/votingModule.svg?style=for-the-badge
[stars-url]: https://github.com/tellor-io/votingModule/stargazers
[issues-shield]: https://img.shields.io/github/issues/tellor-io/votingModule.svg?style=for-the-badge
[issues-url]: https://github.com/tellor-io/votingModule/issues
[license-shield]: https://img.shields.io/github/license/tellor-io/votingModule.svg?style=for-the-badge
[license-url]: https://github.com/tellor-io/votingModule/blob/main/LICENSE.txt
[screenshot]: https://user-images.githubusercontent.com/21370350/165222959-8581c860-1bf0-425e-aa05-500c530a2567.png
