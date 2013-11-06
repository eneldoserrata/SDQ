/*jslint browser: true*/
/*global $, jQuery*/

(function ($) {
    //------------------------------//
    // Métodos privados del plugin //
    var soloNumeros = function (e) {
            var input;
            if (e.metaKey || e.ctrlKey) {
                return true;
            }
            if (e.which === 32) {
                return false;
            }
            if (e.which === 0 || e.which === 8 || e.which === 46) {
                return true;
            }
            if (e.which < 33) {
                return true;
            }
            input = String.fromCharCode(e.which);
            return !!/[\d\s]/.test(input);
        },

        antiPaste = function (e) {
            var valor,
                valorAnterior = $(e.currentTarget).val();

            return setTimeout(function () {
                valor = $(e.currentTarget).val();
                if (!/^\d+$/.test(valor)) {
                    $(e.currentTarget).val(valorAnterior);
                }
            }, 0);
        },

        validarMod10 = function (datos) {
            var calc, i,
                checksum = 0, // running checksum total
                j = 1; // toma el valor 1 o 2

            // Procesa cada digito comenzando por la derecha
            for (i = datos.length - 1; i >= 0; i -= 1) {
                // Extrae el siguiente digito y multiplica por 1 o 2 en digitos alternativos
                calc = Number(datos.charAt(i)) * j;
                // Si el resultado es de 2 digitos agrega 1 al checksum total
                if (calc > 9) {
                    checksum = checksum + 1;
                    calc = calc - 10;
                }
                // Agrega los elmentos unitarios al checksum total
                checksum = checksum + calc;
                // Cambia el valor de j
                if (j === 1) {
                    j = 2;
                } else {
                    j = 1;
                }
            }
            // Listo - si el checksum es divisible por 10, es un modulo 10 valido
            // Si no, reporta error.
            return (checksum % 10 === 0);
        },

        validarModRNC = function (datos) {
            var i, digito, resto,
                suma = 0,

                //Peso de cada uno de los elementos del rnc. Es parecido al algoritmo
                //del Mod10 pero el RNC utiliza su propio sistema de peso.
                pesoRNC = [7, 9, 8, 6, 5, 4, 3, 2];

            //Convierte el string que contiene el rnc en un arreglo de enteros.
            datos = datos.split("").map(function (t) {
                return parseInt(t, 10);
            });

            for (i = pesoRNC.length - 1; i >= 0; i -= 1) {
                suma = suma + (pesoRNC[i] * datos[i]);
            }

            resto = suma % 11;

            switch (resto) {
            case 0:
                digito = 2;
                break;
            case 1:
                digito = 1;
                break;
            default:
                digito = 11 - resto;
            }

            // Validar el resultado con el digito validador,
            //que en caso del RNC es el ultimo digito.
            return (digito === datos.slice(-1)[0]);
        },

        validarNcf = function (datos) {
            //TODO: mejorar el regex para que valide los tipos de NCF posibles
            //Alguien que sepa más regular expressions que por favor lo ponga, mientras tanto aqui hay un arreglo
            //para que queden claros los que son validos
            var tiposNcfPosibles = ['01', '02', '03', '04', '11', '12', '13', '14', '15'],
                regExp = /[a-uA-U]\d{2}\d{3}\d{3}\d{2}\d{8}/;

            return regExp.test(datos) && datos.length === 19;
        },

        formatCedula = function (e) {
            var entrada, valorCampo, longitudCampo, keysPermitidos,
                longitudPermitida, cedulaPatron, $target;

            $target = $(e.currentTarget);

            longitudPermitida = 11;

            cedulaPatron = /(^\d{3}$)|(^\d{3} \d{7}$)/;

            entrada = String.fromCharCode(e.which);

            valorCampo = $target.val();
            longitudCampo = (valorCampo.replace(/\D/g, '') + entrada).length;

            //teclas permitidas, para poder darle a back cuando el textbox esté lleno
            keysPermitidos = [8, 46];
            if (keysPermitidos.indexOf(e.which) !== -1) {
                return true;
            }

            if (longitudCampo > longitudPermitida) {
                return false;
            }
            if (cedulaPatron.test(valorCampo)) {
                e.preventDefault();
                return $target.val(valorCampo + ' ' + entrada);
            }
            if (cedulaPatron.test(valorCampo + entrada)) {
                e.preventDefault();
                return $target.val(valorCampo + entrada + ' ');
            }
            return true;
        },

        methods = {
            cedula: function (options) {
                this.on('keypress', soloNumeros);
                this.on('keypress', formatCedula);
                this.on('paste', antiPaste);
                return this;
            },
            rnc: function (options) {
                this.on('keypress', soloNumeros);
                //this.on('keypress', formatCedula);
                this.on('paste', antiPaste);
                return this;
            },
            nss: function (options) {
                this.on('keypress', soloNumeros);
                //this.on('keypress', formatCedula);
                this.on('paste', antiPaste);
                return this;
            }
        },

        // Estas cedulas fueron emitidas por la JCE, pero no cumplen con el
        //digito verificador, por lo cual deben ser verificadas por separado.
        excepcionesCedulas = ['00000000018', '11111111123', '00100759932', '00105606543', '00114272360', '00200123640',
                      '00200409772', '00800106971', '01200004166', '01400074875', '01400000282', '03103749672',
                      '03200066940', '03800032522', '03900192284', '04900026260', '05900072869', '07700009346',
                      '00114532330', '03121982479', '40200700675', '40200639953', '00121581750', '00119161853',
                      '22321581834', '00121581800', '09421581768', '22721581818', '90001200901', '00301200901',
                      '40200452735', '40200401324', '10621581792', '00208430205', '00101118022', '00167311001',
                      '00102025201', '02755972001', '01038813907', '01810035037', '00161884001', '00102630192',
                      '00000021249', '00144435001', '00100350928', '00100523399', '00109402756', '00101659661',
                      '00539342005', '00104662561', '08016809001', '05500012039', '00104486903', '00103754365',
                      '01200014133', '10983439110', '08498619001', '00104862525', '00100729795', '00644236001',
                      '01650257001', '00170009162', '00651322001', '00297018001', '00100288929', '00190002567',
                      '01094560111', '01300020331', '00109785951', '00110047715', '05400067703', '00100061945',
                      '00100622461', '02831146001', '10462157001', '00100728113', '00108497822', '00481106001',
                      '00100181057', '10491297001', '00300244009', '00170115579', '02038569001', '00100238382',
                      '03852380001', '00100322649', '00107045499', '00100384523', '00130610001', '06486186001',
                      '00101621981', '00201023001', '00520207699', '00300636564', '00000140874', '05700071202',
                      '03100673050', '00189405093', '00105328185', '10061805811', '00117582001', '00103443802',
                      '00100756082', '00100239662', '04700027064', '04700061076', '05500023407', '05500017761',
                      '05400049237', '05400057300', '05600038964', '05400021759', '00100415853', '05500032681',
                      '05500024190', '06400011981', '05500024135', '06400007916', '05500014375', '05500008806',
                      '05500021118', '05600051191', '00848583056', '00741721056', '04801245892', '04700004024',
                      '00163709018', '05600267737', '00207327056', '00731054054', '00524571001', '00574599001',
                      '00971815056', '06800008448', '04900011690', '03111670001', '00134588056', '04800019561',
                      '05400040523', '05400048248', '05600038251', '00222017001', '06100011935', '06100007818',
                      '00129737056', '00540077717', '00475916056', '00720758056', '02300062066', '02700029905',
                      '02600094954', '11700000658', '03100109611', '04400002002', '03400157849', '03900069856',
                      '00100524531', '00686904003', '00196714003', '00435518003', '00189213001', '06100009131',
                      '02300085158', '02300047220', '00100593378', '00100083860', '00648496171', '00481595003',
                      '00599408003', '00493593003', '00162906003', '00208832003', '00166533003', '00181880003',
                      '00241997013', '00299724003', '00174729003', '01000005580', '00400012957', '00100709215',
                      '08900001310', '05400053627', '05400055770', '08800003986', '02300031758', '01154421047',
                      '00300013835', '00300011700', '01300001142', '00147485003', '00305535206', '05400054156',
                      '06100016486', '00100172940', '04800046910', '00101527366', '00270764013', '00184129003',
                      '05400033166', '05400049834', '05400062459', '09700003030', '05300013029', '05400037495',
                      '05400028496', '05400059956', '05400072273', '02300052220', '00356533003', '00163540003',
                      '00376023023', '00362684023', '00633126023', '00278005023', '00235482001', '00142864013',
                      '00131257003', '00236245013', '00757398001', '00146965001', '00516077003', '00425759001',
                      '00857630012', '06843739551', '02300023225', '00298109001', '00274652001', '00300017875',
                      '00300025568', '01300005424', '00103266558', '00174940001', '00289931003', '00291549003',
                      '02800021761', '02800029588', '01000268998', '02600036132', '00200040516', '01100014261',
                      '02800000129', '01200033420', '02800025877', '00300020806', '00200021994', '00200063601',
                      '07600000691', '09300006239', '00200028716', '04900028443', '00163549012', '01200008613',
                      '01200011252', '01100620962', '00100255349', '00108796883', '03102828522', '00000719400',
                      '00004110056', '00000065377', '00000292212', '00000078587', '00000126295', '00000111941',
                      '12019831001', '00171404771', '03000411295', '00000564933', '00000035692', '00143072001',
                      '03102936385', '00000155482', '00000236621', '00400001552', '04941042001', '00300169535',
                      '00102577448', '03600127038', '00100174666', '00100378440', '00104785104', '00101961125',
                      '05600063115', '00110071113', '00100000169', '04902549001', '00155144906', '06337850001',
                      '02300054193', '00100016495', '00101821735', '00544657001', '03807240010', '08952698001',
                      '00345425001', '06100013662', '08900005064', '05400058964', '05400022042', '05400055485',
                      '05400016031', '05400034790', '05400038776', '05400076481', '05400060743', '05400047674',
                      '00246160013', '00116256005', '00261011013', '01600026316', '00103983004', '05600037761',
                      '00291431001', '00100530588', '01600009531', '05500022399', '05500003079', '05500006796',
                      '05500027749', '06400014372', '00352861001', '00100053841', '00218507031', '02300037618',
                      '04600198229', '00000058035', '04700074827', '04700070460', '04700020933', '07800000968',
                      '00300019575', '00100126468', '00300001538'];

    //------------------------//
    // Definición del plugin //

    if (!$.SDQ) {
        $.SDQ = {};
    }

    $.fn.SDQ = function (method) {

        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        }
        if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        }

        //TODO: Si no se cumplen los IFs anteriores no hay retorno
        $.error('Method ' + method + ' does not exist on jQuery.SDQ');
    };

    //------------------------------//
    // Métodos publicos del plugin //

    /* Valida un dato como cédula de identidad y electoral.*/
    /*
     * @param {string} <datos> El dato a validar.
     * @return {boolean} `true` si el datos es una cédula de identidad
     */
    $.SDQ.validarCedula = function (datos) {
        datos = datos.replace(/\s/g, "");

        // Validar longitud
        if (datos.length !== 11) {
            return false;
        }

        // Validar que solo sean numeros
        if (!/^\d+$/.test(datos)) {
            return false;
        }

        // Validar el listado
        if (jQuery.inArray(datos, excepcionesCedulas) > -1) {
            return true;
        }

        // Validar el algoritmo (LUHN)
        return validarMod10(datos);
    };

    $.SDQ.validarRNC = function (datos) {
        datos = datos.replace(/\s/g, "");

        // Validar longitud, debe ser de 9 caracteres.
        if ((datos.length !== 9)) {
            return false;
        }

        // Validar que solo sean numeros
        if (!/^\d+$/.test(datos)) {
            return false;
        }

        //TODO: Verificar si existe un listado que no cumpla con el algoritmo

        // Validar el algoritmo de la DGII
        return validarModRNC(datos);

    };

    $.SDQ.validarNCF = function (datos) {
        datos = datos.replace(/\s/g, "");
        return validarNcf(datos);
    };

    $.SDQ.validarNSS = function (datos) {
        datos = datos.replace(/\s/g, "");
        // Validar longitud
        if (datos.length !== 9) {
            return false;
        }

        // Validar que solo sean numeros
        if (!/^\d+$/.test(datos)) {
            return false;
        }

        // TODO: Validar el listado

        // TODO: Validar el algoritmo

        // Retornar el resultado
        return true;

    };

}(jQuery));
