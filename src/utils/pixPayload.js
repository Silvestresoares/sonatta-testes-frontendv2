function formatPixField(id, value) {
  const size = String(value.length).padStart(2, '0');
  return `${id}${size}${value}`;
}

function crc16(payload) {
  let polynomial = 0x1021;
  let result = 0xFFFF;
  
  if (payload.length > 0) {
    for (let offset = 0; offset < payload.length; offset++) {
      result ^= (payload.charCodeAt(offset) << 8);
      for (let bitwise = 0; bitwise < 8; bitwise++) {
        if ((result <<= 1) & 0x10000) {
          result ^= polynomial;
        }
        result &= 0xFFFF;
      }
    }
  }
  return result.toString(16).toUpperCase().padStart(4, '0');
}

export function generatePixPayload({ chave, nome, cidade, valor }) {
  const payloadFormat = formatPixField('00', '01');
  
  const merchantAccountInfoGUI = formatPixField('00', 'br.gov.bcb.pix');
  const merchantAccountInfoKey = formatPixField('01', chave);
  const merchantAccountInfo = formatPixField('26', merchantAccountInfoGUI + merchantAccountInfoKey);
  
  const merchantCategoryCode = formatPixField('52', '0000');
  const transactionCurrency = formatPixField('53', '986');
  
  let transactionAmount = '';
  if (valor) {
    const formattedValor = Number(valor).toFixed(2);
    transactionAmount = formatPixField('54', formattedValor);
  }
  
  const countryCode = formatPixField('58', 'BR');
  
  // Format nome and cidade to remove accents and limit size
  const formattedNome = nome.substring(0, 25).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const formattedCidade = cidade.substring(0, 15).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  
  const merchantName = formatPixField('59', formattedNome);
  const merchantCity = formatPixField('60', formattedCidade);
  
  const additionalDataField = formatPixField('62', formatPixField('05', '***'));
  
  const payload = payloadFormat + 
                  merchantAccountInfo + 
                  merchantCategoryCode + 
                  transactionCurrency + 
                  transactionAmount + 
                  countryCode + 
                  merchantName + 
                  merchantCity + 
                  additionalDataField + 
                  '6304'; // CRC id + length
                  
  const crc = crc16(payload);
  
  return payload + crc;
}
