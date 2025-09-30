;; title: lock
;; version:
;; summary:
;; description:

;; traits
;;

;; token definitions
;;

;; constants
(define-constant err-amount (err u100))
(define-constant err-exceed-amount (err u102))
;;

;; data vars
;;

;; data maps
(define-map lock-info
  principal
  uint
)
;;

;; public functions
(define-public (lock-funds (amount uint))
  (begin
    (asserts! (> amount u0) err-amount)
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (map-set lock-info tx-sender (+ (get-locked-amount) amount))
    (ok true)
  )
)

(define-public (withdraw (amount uint))
  (begin
    (asserts! (> amount u0) err-amount)
    (let (
        (locked_amount (get-locked-amount))
        (recipient tx-sender)
      )
      (asserts! (<= amount locked_amount) err-exceed-amount)
      (try! (as-contract (stx-transfer? amount tx-sender recipient)))
      (map-set lock-info tx-sender (- locked_amount amount))
      (ok true)
    )
  )
)

;;

;; read only functions
(define-read-only (get-locked-amount)
  (default-to u0 (map-get? lock-info tx-sender))
)
;;

;; private functions

;;
