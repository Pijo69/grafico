</main>

<footer class="pie">
    <div class="pie__inner">
        <a class="pie__logo" href="index.php" aria-label="IZZON LAB, inicio">
            <?= svg_logo('', 'IZZON LAB') ?>
        </a>
        <div class="pie__texto">
            <p class="pie__aviso">Documentos para uso exclusivamente interno para trabajadores de la empresa.</p>
            <p class="pie__copy">&copy; <?= date('Y') ?> IZZON Lab / Todos los derechos reservados.</p>
        </div>
    </div>
</footer>

<script src="assets/js/main.js?v=2" defer></script>
<?php foreach ($scripts ?? [] as $script): ?>
<script src="<?= e($script) ?>?v=1" defer></script>
<?php endforeach; ?>
</body>
</html>
