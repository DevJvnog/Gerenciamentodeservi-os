document.addEventListener('DOMContentLoaded', function() {
    const serviceForm = document.getElementById('service-form');
    const plateInput = document.getElementById('plate-input');
    const modelInput = document.getElementById('model-input');
    const colorInput = document.getElementById('color-input');
    const descriptionInput = document.getElementById('description-input');
    const responsavelInput = document.getElementById('responsavel-input');
    const startDateInput = document.getElementById('start-date-input');
    const endDateInput = document.getElementById('end-date-input');
    const serviceBody = document.getElementById('service-body');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const printButton = document.getElementById('print-button');
    const addServiceButton = document.getElementById('add-service');

    let services = [];

    // Função para salvar os serviços no localStorage
    function saveServices() {
      localStorage.setItem('services', JSON.stringify(services));
    }

    // Função para carregar os serviços do localStorage, se existirem
    function loadServices() {
      const savedServices = localStorage.getItem('services');
      if (savedServices) {
        services = JSON.parse(savedServices);
        // Recalcular o tempo restante para cada serviço
        services.forEach(service => {
          service.timeRemaining = calculateTimeRemaining(service.startDate, service.endDate).formatted;
        });
        renderServiceTable(); // Renderizar a tabela após recalcular o tempo restante
      }
    }

    // Carregar os serviços ao iniciar a página
    loadServices();

    // Função para calcular o tempo restante e formatar para exibição
    function calculateTimeRemaining(startDate, endDate) {
      const now = new Date();
      const difference = new Date(endDate) - now;
      if (difference <= 0) {
        return { formatted: 'Expirado', expired: true };
      }
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      return { formatted: `${days} D ${hours} H ${minutes} M ${seconds} S`, expired: false };
    }

    // Função para adicionar um novo serviço
    addServiceButton.addEventListener('click', function() {
      const plate = plateInput.value.trim();
      const model = modelInput.value.trim();
      const color = colorInput.value.trim();
      const description = descriptionInput.value.trim();
      const responsavel = responsavelInput.value.trim();
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;

      if (plate !== '' && model !== '' && color !== '' && description !== '' && responsavel !== '' && startDate !== '' && endDate !== '') {
        const timeRemaining = calculateTimeRemaining(startDate, endDate);
        const service = {
          plate: plate,
          model: model,
          color: color,
          description: description,
          responsavel: responsavel,
          startDate: startDate,
          endDate: endDate,
          timeRemaining: timeRemaining.formatted,
          status: 'Em andamento'
        };
        services.push(service);
        renderServiceTable(); // Renderiza a tabela novamente após adicionar um novo serviço
        saveServices(); // Salvar os serviços após adicionar um novo
        clearInputs();
      }
    });

    // Função para renderizar a tabela de serviços
    function renderServiceTable() {
      serviceBody.innerHTML = '';
      services.forEach((service, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${service.plate}</td>
          <td>${service.model}</td>
          <td>${service.color}</td>
          <td>${service.description}</td>
          <td>${service.responsavel}</td>
          <td>${service.startDate}</td>
          <td>${service.endDate}</td>
          <td>${service.timeRemaining}</td>
          <td>${service.status}</td>
          <td><button class="delete-button" data-index="${index}">Excluir</button></td>
          <td><button class="finish-button" data-index="${index}">Finalizar</button></td>
        `;
        serviceBody.appendChild(row);
      });
    }

    // Função para limpar os inputs do formulário
    function clearInputs() {
      plateInput.value = '';
      modelInput.value = '';
      colorInput.value = '';
      descriptionInput.value = '';
      responsavelInput.value = '';
      startDateInput.value = '';
      endDateInput.value = '';
    }

    // Pesquisar serviços por placa
    searchButton.addEventListener('click', function() {
      const searchTerm = searchInput.value.trim();
      if (searchTerm !== '') {
        const filteredServices = services.filter(service => service.plate === searchTerm);
        renderServiceTable(filteredServices);
      } else {
        renderServiceTable();
      }
    });

    // Função para imprimir a tabela de serviços
    printButton.addEventListener('click', function() {
      window.print();
    });

    // Excluir serviço
    serviceBody.addEventListener('click', function(event) {
      if (event.target.classList.contains('delete-button')) {
        const index = event.target.dataset.index;
        services.splice(index, 1);
        renderServiceTable();
        saveServices();
      }
    });

    // Finalizar serviço
    serviceBody.addEventListener('click', function(event) {
      if (event.target.classList.contains('finish-button')) {
        const index = event.target.dataset.index;
        services[index].status = 'Finalizado';
        renderServiceTable();
        saveServices();
      }
    });

    // Atualizar o tempo restante a cada segundo
    setInterval(function() {
      services.forEach((service, index) => {
        const timeRemainingCell = document.querySelector(`#service-body tr:nth-child(${index + 1}) td:nth-child(8)`);
        if (timeRemainingCell) {
          const timeRemaining = calculateTimeRemaining(service.startDate, service.endDate);
          timeRemainingCell.textContent = timeRemaining.formatted;
          if (timeRemaining.expired && service.status === 'Em andamento') {
            handleExpiredService(service, index);
          }
        }
      });
    }, 1000); // Atualiza a cada segundo

    // Lidar com o serviço expirado
    function handleExpiredService(service, index) {
      if (confirm(`Responsável: ${service.responsavel}\nFavor validar serviço: ${service.description}\nTempo expirado!\nDeseja justificar?`)) {
        const justification = prompt('Por favor, insira sua justificativa:');
        if (justification !== null) {
          service.status = 'Justificado';
          // Enviar detalhes do serviço e justificativa para o WhatsApp cadastrado
          const serviceDetails = `Responsável: ${service.responsavel}\nDescrição: ${service.description}\nTempo expirado!\nJustificativa: ${justification}`;
          const whatsappLink = `https://api.whatsapp.com/send?phone=${encodeURIComponent('+5534991791200')}&text=${encodeURIComponent(serviceDetails)}`;
          window.open(whatsappLink, '_blank');
          renderServiceTable(); // Renderizar a tabela novamente após justificar o serviço
          saveServices(); // Salvar os serviços após justificar
        }
      }
    }

    // Função para exibir o modal
    function showModal() {
      document.getElementById('modal').style.display = 'flex';
    }

    // Função para ocultar o modal
    function hideModal() {
      document.getElementById('modal').style.display = 'none';
    }

    // Event listener para o botão "Justificar" no modal
    document.getElementById('justify-button').addEventListener('click', function() {
      const justification = document.getElementById('justification-input').value;
      // Faça o que for necessário com a justificativa aqui
      console.log('Justificação:', justification);
      hideModal();
    });

    // Event listener para o botão "Cancelar" no modal
    document.getElementById('cancel-button').addEventListener('click', hideModal);

    // Função para verificar se o serviço está expirado
    function isServiceExpired(service) {
      const now = new Date();
      const endDate = new Date(service.endDate);
      return endDate < now;
    }

    // Event listener para os botões "Justificar" dentro da tabela de serviços
    serviceBody.addEventListener('click', function(event) {
      if (event.target.classList.contains('justify-button')) {
        const serviceIndex = event.target.dataset.index;
        handleExpiredService(services[serviceIndex], serviceIndex);
      }
    });
});
